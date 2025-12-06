// scripts/debugReadImplSlot.ts
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

function addressFromStorageSlot(slotHex: string) {
  // storage slot returns 32 bytes hex; last 20 bytes are address
  const h = slotHex.replace(/^0x/, "");
  return "0x" + h.slice(24); // start at byte index 12 (24 hex chars) -> last 40 hex chars
}




async function main() {
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  const deployments = readDeployment(networkName) ?? {};
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy ?? deployments?.Governor?.address;
  if (!governorProxy) throw new Error("Governor proxy not set");

  const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  console.log("Governor proxy:", governorProxy);
  console.log("Reading implementation slot:", IMPLEMENTATION_SLOT);
  const raw = await hreEthers.provider.send("eth_getStorageAt", [governorProxy, IMPLEMENTATION_SLOT, "latest"]);
  console.log("raw slot:", raw);
  console.log("implementation address:", addressFromStorageSlot(raw));
}

main().catch((err) => {
  console.error("readImplSlot failed:", err?.message ?? err);
  process.exit(1);
});




