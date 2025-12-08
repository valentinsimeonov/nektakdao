
// scripts/debugExecuteScheduledOpNow.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const ethers = (hre as any).ethers;
  const provider = ethers.provider;

  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS!;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS!;
  const implToUpgrade = process.env.LAST_IMPL_ADDRESS ?? process.env.GOVERNOR_IMPL_ADDRESS!;
  const saltEnv = process.env.LAST_UPGRADE_SALT;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;

  if (!timelockAddr || !governorProxy || !implToUpgrade || !saltEnv) {
    throw new Error("Set TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS (or GOVERNOR_IMPL_ADDRESS), and LAST_UPGRADE_SALT in .env");
  }
  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env (an account with ETH to pay gas).");

  const wallet = new ethers.Wallet(pk, provider);

  // Build upgrade calldata (exact same as when scheduled)
  const uupsIface = new ethers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [implToUpgrade]);

  const predecessor = '0x' + '00'.repeat(32);
  const salt = saltEnv.startsWith("0x") ? saltEnv : "0x" + saltEnv.replace(/^0x/, "");

  // single-target execute signature
  const tlIf = new ethers.Interface([
    "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
  ]);
  const execCalldata = tlIf.encodeFunctionData("execute", [governorProxy, 0, upgradeCalldata, predecessor, salt]);

  console.log("Timelock:", timelockAddr);
  console.log("Governor proxy:", governorProxy);
  console.log("impl (target of inner upgrade):", implToUpgrade);
  console.log("upgrade calldata:", upgradeCalldata);
  console.log("exec calldata (timelock.execute payload):", execCalldata.slice(0, 10), "...");

  // 1) Simulate with provider.call (no tx sent)
  console.log("Simulating provider.call (no tx) from", wallet.address, "...");
  try {
    const callRes = await provider.call({ to: timelockAddr, data: execCalldata, from: wallet.address });
    console.log("provider.call returned (no revert). Result:", callRes);
    console.log("Simulation succeeded — sending transaction now...");
  } catch (simErr: any) {
    console.error("Simulation reverted. raw:", simErr?.data ?? simErr?.error?.data ?? simErr?.message ?? simErr);
    // If it's TimelockUnexpectedOperationState the call will revert here.
    return;
  }

  // 2) Send the tx
  try {
    const tx = await wallet.sendTransaction({ to: timelockAddr, data: execCalldata, gasLimit: 400_000 });
    console.log("tx submitted:", tx.hash);
    const rcpt = await tx.wait();
    console.log("tx mined:", rcpt.transactionHash, "status:", rcpt.status ?? rcpt.status === 1 ? "success" : "failed");
    if ((rcpt as any).status === 1 || (rcpt as any).status === "0x1" || (rcpt as any).status === 1n) {
      console.log("Execute succeeded — governor proxy should now point to new implementation:", implToUpgrade);
    } else {
      console.log("Execute failed (receipt status != 1). See trace/logs.");
    }
  } catch (err: any) {
    console.error("Sending tx failed. Attempting to extract revert data...");
    const r = err?.error?.data ?? err?.data ?? err?.body ?? err?.message ?? err;
    if (typeof r === "string" && r.startsWith("0x08c379a0")) {
      // decode Error(string)
      const lenHex = r.slice(10 + 64, 10 + 64 + 64);
      const len = parseInt(lenHex, 16) * 2;
      const strHex = r.slice(10 + 64 + 64, 10 + 64 + 64 + len);
      console.log("Decoded revert string:", Buffer.from(strHex, "hex").toString("utf8"));
    } else {
      console.log("raw revert:", r);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

