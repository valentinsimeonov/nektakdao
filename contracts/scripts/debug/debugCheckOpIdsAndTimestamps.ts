


// scripts/debugCheckOpIdsAndTimestamps.ts

import hre from "hardhat";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main(){
  const provider = (hre as any).ethers.provider;
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS!;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS!;
  const implToUpgrade = process.env.LAST_IMPL_ADDRESS ?? process.env.GOVERNOR_IMPL_ADDRESS!;
  const saltEnv = process.env.LAST_UPGRADE_SALT ?? process.env.LAST_SALT ?? process.env.UPGRADE_SALT;
  if(!timelockAddr || !governorProxy || !implToUpgrade || !saltEnv){
    throw new Error("Set TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS (and optionally LAST_UPGRADE_SALT) in .env");
  }

  const ethers = (hre as any).ethers;
  const tlIfaceSingle = new ethers.Interface([
    "function hashOperation(address,uint256,bytes,bytes32,bytes32) public pure returns (bytes32)",
    "function getTimestamp(bytes32) view returns (uint256)",
    "function isOperation(bytes32) view returns (bool)",
    "function isOperationReady(bytes32) view returns (bool)"
  ]);
  // We'll compute the same inputs you used when scheduling:
  const target = governorProxy;
  const value = 0;
  const ifaceUUPS = new ethers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = ifaceUUPS.encodeFunctionData("upgradeTo", [implToUpgrade]);
  const predecessor = '0x' + '00'.repeat(32);
  const salt = saltEnv.startsWith("0x") ? saltEnv : ("0x" + saltEnv.replace(/^0x/, ""));

  // compute id via ABI same as timelock.hashOperation
  const hashOpData = ethers.keccak256(ethers.AbiCoder.prototype.encode(
    ["address","uint256","bytes","bytes32","bytes32"],
    [target, value, upgradeCalldata, predecessor, salt]
  ));

  console.log("Computed op id (keccak of abi.encode(...)) :", hashOpData);
  console.log("Scheduled op id (from CallScheduled event) : paste the scheduled id here for comparison (if you have it).");

  // Query on-chain timestamp / state for the computed id
  // call getTimestamp on the timelock proxy
  const getTsCalldata = tlIfaceSingle.encodeFunctionData("getTimestamp", [hashOpData]);
  const resHex = await provider.call({ to: timelockAddr, data: getTsCalldata });
  try {
    const decoded = tlIfaceSingle.decodeFunctionResult("getTimestamp", resHex);
    const ts = decoded[0].toString();
    console.log("getTimestamp(computedId) ->", ts);
    if (ts === '0') {
      console.log(" -> The computed id is UNSET (not scheduled). That's why execute reverts.");
    } else if (ts === '1') {
      console.log(" -> The computed id is DONE (already executed).");
    } else {
      console.log(" -> The computed id is scheduled to be ready at unix ts:", ts, " (ready if <= current block time).");
      const block = await provider.getBlock("latest");
      console.log("   current chain ts:", block.timestamp);
    }
  } catch (e) {
    console.warn("Could not call getTimestamp (provider error):", e);
  }

  // bonus: print the event id that was emitted by schedule (if you have it)
  // If you know the event id (from Base Explorer) paste it here and we'll compare manually.
}

main().catch(e => { console.error(e); process.exit(1); });
