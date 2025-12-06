// scripts/debugTryUpgradeToCurrent.ts
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
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  const deployments = readDeployment(networkName) ?? {};

  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy;
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS ?? deployments?.Timelock?.proxy ?? deployments?.Timelock?.address;

  if (!governorProxy) throw new Error("GOVERNOR_PROXY_ADDRESS required");
  if (!timelock) throw new Error("TIMELOCK_PROXY_ADDRESS required");

  // read current implementation from ERC1967 slot
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const raw = await hreEthers.provider.send("eth_getStorageAt", [governorProxy, implSlot, "latest"]);
  const currentImpl = "0x" + raw.replace(/^0x/, "").slice(24);

  console.log("governorProxy:", governorProxy);
  console.log("timelock:", timelock);
  console.log("currentImpl (from proxy slot):", currentImpl);

  const iface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const calldata = iface.encodeFunctionData("upgradeTo", [currentImpl]);

  // simulate call to proxy as if msg.sender were timelock (delegatecall path)
  try {
    const result = await hreEthers.provider.call({ to: governorProxy, data: calldata, from: timelock });
    console.log("provider.call succeeded (raw):", result);
    console.log("This indicates _authorizeUpgrade did NOT revert in the delegatecall context for currentImpl.");
  } catch (err: any) {
    console.error("provider.call reverted. raw:", err?.data ?? err?.error?.data ?? err?.message ?? err);
  }
}

main().catch((err) => { console.error("debugTryUpgradeToCurrent failed:", err?.message ?? err); process.exit(1); });





