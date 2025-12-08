// scripts/debugDiagnoseUpgrade.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const hreEthers = (hre as any).ethers;
const OUT_DIR = path.join(__dirname, "..", "deployments");
function readDeployment(network: string) {
  const p = path.join(OUT_DIR, `${network}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  console.log("Network:", networkName, "using deployer:", wallet.address);

  const deployments = readDeployment(networkName) ?? {};
  const timelockAddr =
    process.env.TIMELOCK_PROXY_ADDRESS ??
    deployments?.Timelock?.proxy ??
    deployments?.Timelock?.address;
  const governorProxy =
    process.env.GOVERNOR_PROXY_ADDRESS ??
    deployments?.Governor?.proxy ??
    deployments?.Governor?.address;

  if (!timelockAddr) throw new Error("TIMELOCK_PROXY_ADDRESS not set and not found in deployments file");
  if (!governorProxy) throw new Error("GOVERNOR_PROXY_ADDRESS not set and not found in deployments file");

  // You MUST set these (copied from the upgrade script logs / explorer):
  const salt = process.env.LAST_UPGRADE_SALT ?? "";
  const impl = process.env.LAST_IMPL_ADDRESS ?? "";

  if (!salt) {
    console.error("Set LAST_UPGRADE_SALT in your .env to the salt printed by upgradeGovernor (the 0x... salt).");
    return;
  }
  if (!impl) {
    console.error("Set LAST_IMPL_ADDRESS in your .env to the impl address printed by upgradeGovernor (the 0x... impl address).");
    return;
  }

  const timelock = await hreEthers.getContractAt("TimelockControllerUpgradeable", timelockAddr, wallet) as any;
  // recreate calldata
  const uupsIface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [impl]);

  console.log("Timelock proxy:", timelockAddr);
  console.log("Governor proxy:", governorProxy);
  console.log("Impl address (used):", impl);
  console.log("Salt (used):", salt);

  // compute opId (single-target)
  const predecessor = '0x' + '00'.repeat(32);
  const opId = await timelock.hashOperation(governorProxy, 0, upgradeCalldata, predecessor, salt);
  console.log("Computed opId:", opId);

  // Timelock helper queries
  try {
    const ts = await timelock.getTimestamp(opId).catch(() => null);
    console.log("getTimestamp(opId):", ts ? ts.toString() : "null");
  } catch (e) { console.warn("getTimestamp failed:", e?.message ?? e); }

  const isOp = await timelock.isOperation(opId).catch(() => null);
  const isReady = await timelock.isOperationReady(opId).catch(() => null);
  const isPending = await timelock.isOperationPending(opId).catch(() => null);
  const isDone = await timelock.isOperationDone(opId).catch(() => null);
  console.log("isOperation:", isOp);
  console.log("isOperationReady:", isReady);
  console.log("isOperationPending:", isPending);
  console.log("isOperationDone:", isDone);

  const block = await hreEthers.provider.getBlock("latest");
  console.log("chain latest block:", block.number, "timestamp:", block.timestamp);

  // read governor.timelock()
  try {
    const gov = await hreEthers.getContractAt("NektakGovernorUpgradeable", governorProxy, wallet) as any;
    const storedTimelock = await gov.timelock().catch(() => null);
    console.log("governor.timelock():", storedTimelock);
    console.log("timelock proxy (we expect governor.timelock() == timelock proxy):", timelockAddr);
  } catch (e) {
    console.warn("Could not read governor.timelock() — maybe ABI mismatch:", (e as any).message ?? e);
  }

  // Print the CallScheduled id from event if available in deployments file (optional)
  const dep = deployments?.Governor ?? {};
  if (dep?.lastUpgradeSalt) console.log("deployments file lastUpgradeSalt:", dep.lastUpgradeSalt);

  console.log("Done.");
}

main().catch((err) => {
  console.error("diagnoseUpgrade failed:", (err as any).message ?? err);
  process.exit(1);
});





