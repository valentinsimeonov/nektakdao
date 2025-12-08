// scripts/debugCheckOpForms.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const ethers = (hre as any).ethers;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const wallet = new ethers.Wallet(pk, ethers.provider);
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS!;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS!;
  const impl = process.env.LAST_IMPL_ADDRESS!;
  const salt = process.env.LAST_UPGRADE_SALT!;

  if (!timelockAddr || !governorProxy || !impl || !salt) {
    throw new Error("Ensure TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS, LAST_UPGRADE_SALT are in .env");
  }

  const tl = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr, wallet) as any;
  const uifs = new ethers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uifs.encodeFunctionData("upgradeTo", [impl]);
  const predecessor = "0x" + "00".repeat(32);

  // single-target opId (hashOperation)
  const opIdSingle = await tl.hashOperation(governorProxy, 0, upgradeCalldata, predecessor, salt);
  console.log("opId (single-target)    :", opIdSingle);

  // batch opId (hashOperationBatch)
  const targets = [governorProxy];
  const values = [0];
  const datas = [upgradeCalldata];
  const opIdBatch = await tl.hashOperationBatch(targets, values, datas, predecessor, salt);
  console.log("opId (batch/array)      :", opIdBatch);

  // Query both
  const check = async (id: string, label: string) => {
    const ts = await tl.getTimestamp(id).catch(() => null);
    const isOp = await tl.isOperation(id).catch(() => null);
    const isReady = await tl.isOperationReady(id).catch(() => null);
    const isPending = await tl.isOperationPending(id).catch(() => null);
    const isDone = await tl.isOperationDone(id).catch(() => null);
    console.log(`--- ${label} ---`);
    console.log(" getTimestamp:", ts?.toString() ?? "null");
    console.log(" isOperation :", isOp);
    console.log(" isReady     :", isReady);
    console.log(" isPending   :", isPending);
    console.log(" isDone      :", isDone);
  };

  await check(opIdSingle, "SINGLE");
  await check(opIdBatch, "BATCH");

  const block = await ethers.provider.getBlock("latest");
  console.log("chain latest block:", block.number, "timestamp:", block.timestamp);
}

main().catch((e) => { console.error(e); process.exit(1); });




