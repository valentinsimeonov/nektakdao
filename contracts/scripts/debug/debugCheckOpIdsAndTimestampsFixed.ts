
// scripts/debugCheckOpIdsAndTimestampsFixed.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const ethers = (hre as any).ethers;
  const provider = ethers.provider;

  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS;
  const implToUpgrade = process.env.LAST_IMPL_ADDRESS ?? process.env.GOVERNOR_IMPL_ADDRESS;
  const saltEnv = process.env.LAST_UPGRADE_SALT ?? process.env.LAST_SALT ?? process.env.UPGRADE_SALT;

  if (!timelockAddr || !governorProxy || !implToUpgrade) {
    throw new Error("Set TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, and LAST_IMPL_ADDRESS (or GOVERNOR_IMPL_ADDRESS). Optionally set LAST_UPGRADE_SALT.");
  }

  const tl = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr);

  const ifaceUUPS = new ethers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = ifaceUUPS.encodeFunctionData("upgradeTo", [implToUpgrade]);

  const predecessor = '0x' + '00'.repeat(32);
  const salt = saltEnv ? (saltEnv.startsWith("0x") ? saltEnv : "0x" + saltEnv.replace(/^0x/, "")) : undefined;

  console.log("Timelock:", timelockAddr);
  console.log("Governor proxy (target):", governorProxy);
  console.log("Impl to upgrade ->", implToUpgrade);
  console.log("upgrade calldata (hex):", upgradeCalldata);
  console.log("predecessor:", predecessor);
  if (salt) console.log("salt (used):", salt);
  else console.log("No salt provided in env; you can still inspect computed id below (salt undefined).");

  // compute opId via on-chain function (exact same logic as timelock)
  let opId: string;
  try {
    if (!salt) {
      console.log("Salt not supplied. Aborting opId compute because salt is required to compute operation id.");
      return;
    }
    opId = await tl.hashOperation(governorProxy, 0, upgradeCalldata, predecessor, salt);
    console.log("Computed opId (via timelock.hashOperation):", opId);
  } catch (e: any) {
    console.error("Failed to call timelock.hashOperation:", e?.message ?? e);
    return;
  }

  // Query states
  try {
    const ts = await tl.getTimestamp(opId).catch(() => null);
    const isOp = await tl.isOperation(opId).catch(() => null);
    const isReady = await tl.isOperationReady(opId).catch(() => null);
    const isPending = await tl.isOperationPending(opId).catch(() => null);
    const isDone = await tl.isOperationDone(opId).catch(() => null);

    console.log("getTimestamp(opId):", ts?.toString() ?? "call failed / null");
    console.log("isOperation:", isOp);
    console.log("isOperationReady:", isReady);
    console.log("isOperationPending:", isPending);
    console.log("isOperationDone:", isDone);

    const block = await provider.getBlock("latest");
    console.log("chain latest block:", block.number, "timestamp:", block.timestamp);
    if (ts && Number(ts) > 1) {
      console.log("Operation ready at:", new Date(Number(ts) * 1000).toISOString());
    } else if (ts === 1 || ts?.toString() === "1") {
      console.log("Operation marked DONE (timestamp==1).");
    } else {
      console.log("Operation timestamp is zero/unset or special (likely not scheduled).");
    }
  } catch (e: any) {
    console.error("Error querying operation state:", e?.message ?? e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
