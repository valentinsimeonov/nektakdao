// scripts/debugCheckProxiable.ts
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
  const impl = process.env.LAST_IMPL_ADDRESS ?? process.env.GOVERNOR_IMPL_ADDRESS ?? deployments?.Governor?.implementation;
  if (!impl) throw new Error("Set LAST_IMPL_ADDRESS or GOVERNOR_IMPL_ADDRESS or add deployments/<network>.json");

  console.log("Network:", networkName);
  console.log("Implementation address to check:", impl);

  // proxiableUUID() selector = bytes4(keccak256("proxiableUUID()"))
  const selector = hreEthers.id("proxiableUUID()").slice(0, 10);
  try {
    const res = await hreEthers.provider.call({ to: impl, data: selector });
    console.log("provider.call returned raw:", res);
    // decode 32-byte bytes32 slot
    const bytes32 = res === "0x" ? "(empty)" : res;
    console.log("Decoded proxiableUUID (hex):", bytes32);
    // also print expected ERC1967 implementation slot constant
    console.log("Expected ERC1967 implementation slot (bytes32): 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
  } catch (err: any) {
    console.error("call to proxiableUUID() reverted. error:", err?.message ?? err);
    // try to extract raw data
    const raw = err?.data ?? err?.error?.data ?? null;
    console.log("raw revert data (if any):", raw);
  }
}

main().catch((err) => { console.error("debugCheckProxiable failed:", err?.message ?? err); process.exit(1); });





