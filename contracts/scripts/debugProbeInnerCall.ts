// scripts/debugProbeInnerCall.ts
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

function hexToString(hex: string) {
  if (!hex || hex === "0x") return "(empty)";
  try {
    const h = hex.replace(/^0x/, "");
    const selector = h.slice(0, 8);
    // Error(string) selector = 08c379a0
    if (selector === "08c379a0") {
      const lenHex = h.slice(8 + 64, 8 + 64 + 64);
      const len = parseInt(lenHex, 16) * 2;
      const strHex = h.slice(8 + 64 + 64, 8 + 64 + 64 + len);
      return Buffer.from(strHex, "hex").toString("utf8");
    }
    // fallback: return the selector name if it's a custom error (we can't decode args without ABI)
    return hex;
  } catch (e) {
    return hex;
  }
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);

  const deployments = readDeployment(networkName) ?? {};
  const timelockAddr =
    process.env.TIMELOCK_PROXY_ADDRESS ??
    deployments?.Timelock?.proxy ??
    deployments?.Timelock?.address;
  const governorProxy =
    process.env.GOVERNOR_PROXY_ADDRESS ??
    deployments?.Governor?.proxy ??
    deployments?.Governor?.address;

  if (!timelockAddr || !governorProxy) throw new Error("Set TIMELOCK_PROXY_ADDRESS and GOVERNOR_PROXY_ADDRESS or add deployments/<network>.json");

  // read last impl/salt if present (optional) or use env LAST_IMPL_ADDRESS
  const impl = process.env.LAST_IMPL_ADDRESS;
  if (!impl) throw new Error("Set LAST_IMPL_ADDRESS in .env (the implementation address you attempted).");

  // build the upgrade calldata
  const uupsIface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [impl]);

  console.log("Simulating direct target call (governor proxy) but with from=timelock...");
  console.log("timelock:", timelockAddr);
  console.log("governorProxy:", governorProxy);
  console.log("impl:", impl);

  const callObj = {
    to: governorProxy,
    data: upgradeCalldata,
    from: timelockAddr,   // IMPORTANT: set msg.sender to timelock
  };

  try {
    const res = await hreEthers.provider.call(callObj);
    console.log("provider.call succeeded (no revert). Result:", res);
    console.log("That implies the inner upgradeTo would succeed when timelock calls it.");
  } catch (err: any) {
    // ethers v6 may put revert data in err.data or err.error.data
    const raw = err?.data ?? err?.error?.data ?? err?.body ?? null;
    console.error("provider.call reverted. raw:", raw);
    console.log("Decoded if it was Error(string):", hexToString(typeof raw === "string" ? raw : (err?.data ?? "")));
    console.log("If you see a custom selector (like 0xd6bda275) that's a timelock wrapper (FailedCall()).");
  }
}

main().catch((err) => {
  console.error("probeInnerCall failed:", err?.message ?? err);
  process.exit(1);
});





