// scripts/tryExecuteScheduledData.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const ethers = (hre as any).ethers;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const wallet = new ethers.Wallet(pk, ethers.provider);
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS!;
  const salt = process.env.LAST_UPGRADE_SALT!;
  const scheduledData = process.env.SCHEDULED_DATA; // must be full hex e.g. 0x3659cfe6...
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS!;

  if (!timelockAddr || !salt || !scheduledData || !governorProxy) {
    throw new Error("Set TIMELOCK_PROXY_ADDRESS, LAST_UPGRADE_SALT, SCHEDULED_DATA, GOVERNOR_PROXY_ADDRESS in .env");
  }

  // Try both execute signatures: single-target and array-target
  const tlIfaceSingle = new ethers.Interface([
    "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
  ]);
  const tlIfaceArray = new ethers.Interface([
    "function execute(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt)"
  ]);
  const predecessor = "0x" + "00".repeat(32);

  // single-target enc
  const encSingle = tlIfaceSingle.encodeFunctionData("execute", [governorProxy, 0, scheduledData, predecessor, salt]);
  // array enc (1-element arrays)
  const encArray = tlIfaceArray.encodeFunctionData("execute", [[governorProxy], [0], [scheduledData], predecessor, salt]);

  console.log("Simulate single-target execute...");
  try {
    await ethers.provider.call({ to: timelockAddr, data: encSingle });
    console.log("SIMULATION: single-target would succeed. Sending tx...");
    const tx = await wallet.sendTransaction({ to: timelockAddr, data: encSingle });
    const rcpt = await tx.wait();
    console.log("TX mined:", rcpt.transactionHash, "status:", rcpt.status);
    return;
  } catch (e: any) {
    console.error("single-target simulation reverted:", e?.data ?? e?.error?.data ?? e?.message ?? e);
  }

  console.log("Simulate array execute...");
  try {
    await ethers.provider.call({ to: timelockAddr, data: encArray });
    console.log("SIMULATION: array execute would succeed. Sending tx...");
    const tx = await wallet.sendTransaction({ to: timelockAddr, data: encArray });
    const rcpt = await tx.wait();
    console.log("TX mined:", rcpt.transactionHash, "status:", rcpt.status);
    return;
  } catch (e: any) {
    console.error("array simulation reverted:", e?.data ?? e?.error?.data ?? e?.message ?? e);
  }

  console.log("Both simulations reverted. See above raw revert bytes. If you want, paste them here and I can decode/identify the selector.");
}

main().catch((e)=>{ console.error(e); process.exit(1); });



