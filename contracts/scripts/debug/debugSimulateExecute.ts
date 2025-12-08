// scripts/debugSimulateExecute.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();
const hreEthers = (hre as any).ethers;
const OUT_DIR = path.join(__dirname, "..", "deployments");
function readDeployment(network: string) {
  const p = path.join(OUT_DIR, `${network}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

async function main() {
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  const deployments = readDeployment(networkName) ?? {};

  const timelock = process.env.TIMELOCK_PROXY_ADDRESS ?? deployments?.Timelock?.proxy ?? deployments?.Timelock?.address;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy;
  const impl = process.env.LAST_IMPL_ADDRESS;
  const salt = process.env.LAST_UPGRADE_SALT;

  if (!timelock || !governorProxy || !impl || !salt) {
    throw new Error("Set TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS, LAST_UPGRADE_SALT in env");
  }

  const uifs = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uifs.encodeFunctionData("upgradeTo", [impl]);
  const predecessor = '0x' + '00'.repeat(32);

  // choose single-target execute signature
  const tlIf = new hreEthers.Interface([
    "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
  ]);
  const enc = tlIf.encodeFunctionData("execute", [governorProxy, 0, upgradeCalldata, predecessor, salt]);

  console.log("Simulating timelock.execute(...) via provider.call (no tx sent)...");
  try {
    const res = await hreEthers.provider.call({ to: timelock, data: enc, from: process.env.DEPLOYER_PRIVATE_KEY ? undefined : undefined });
    console.log("provider.call returned (no revert). Result:", res);
  } catch (err: any) {
    const raw = err?.data ?? err?.error?.data ?? err?.body ?? null;
    console.error("provider.call reverted. raw:", raw);
    if (typeof raw === "string") {
      // try to decode Error(string)
      if (raw.startsWith("0x08c379a0")) {
        const lenHex = raw.slice(10 + 64, 10 + 64 + 64);
        const len = parseInt(lenHex, 16) * 2;
        const strHex = raw.slice(10 + 64 + 64, 10 + 64 + 64 + len);
        console.log("Decoded revert string:", Buffer.from(strHex, "hex").toString("utf8"));
      } else {
        console.log("raw hex (selector may indicate custom timelock wrapper):", raw.slice(0, 10));
      }
    }
  }
}

main().catch((err) => { console.error("debugSimulateExecute failed:", err?.message ?? err); process.exit(1); });





