// scripts/debugProbeExecute.ts
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
  // try decode Error(string) ABI: selector 0x08c379a0
  if (!hex || hex === "0x") return "(empty)";
  try {
    // remove 0x
    const h = hex.replace(/^0x/, "");
    // If it's Error(string): 4 bytes selector + offset + length + bytes
    const selector = h.slice(0, 8);
    if (selector === "08c379a0") {
      // decode as Error(string)
      const lengthHex = h.slice(8 + 64, 8 + 64 + 64);
      const len = parseInt(lengthHex, 16) * 2;
      const strHex = h.slice(8 + 64 + 64, 8 + 64 + 64 + len);
      const buf = Buffer.from(strHex, "hex");
      return buf.toString("utf8");
    }
    // fallback: return raw hex
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
  console.log("Network:", networkName, "using:", wallet.address);

  const deployments = readDeployment(networkName) ?? {};
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS ?? deployments?.Timelock?.proxy ?? deployments?.Timelock?.address;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy ?? deployments?.Governor?.address;
  if (!timelockAddr || !governorProxy) throw new Error("Set TIMELOCK_PROXY_ADDRESS and GOVERNOR_PROXY_ADDRESS or include them in deployments/<network>.json");

  const salt = process.env.LAST_UPGRADE_SALT;
  const impl = process.env.LAST_IMPL_ADDRESS;
  if (!salt || !impl) throw new Error("Set LAST_UPGRADE_SALT and LAST_IMPL_ADDRESS in .env to the values printed by upgradeGovernor");

  console.log("timelock:", timelockAddr);
  console.log("governorProxy:", governorProxy);
  console.log("impl:", impl);
  console.log("salt:", salt);

  const tlIfaceSingle = new hreEthers.Interface([
    "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
  ]);
  const uupsIface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [impl]);
  const predecessorZero = '0x' + '00'.repeat(32);

  const execCalldata = tlIfaceSingle.encodeFunctionData(
    "execute(address,uint256,bytes,bytes32,bytes32)",
    [governorProxy, 0, upgradeCalldata, predecessorZero, salt]
  );

  console.log("Simulating timelock.execute(...) via provider.call (no tx sent)...");
  try {
    const res = await hreEthers.provider.call({ to: timelockAddr, data: execCalldata });
    console.log("provider.call returned (no revert). Result:", res);
    console.log("That means the call would succeed if sent as a tx.");
  } catch (err: any) {
    // Ethers v6 throws with .data (raw revert data) or error.message
    console.error("provider.call reverted. Attempting to extract revert data...");
    const data = err?.data ?? err?.error?.data ?? err?.body;
    // err.body might be JSON string; attempt to extract "data" hex inside
    if (!data && typeof err?.body === "string") {
      try {
        const parsed = JSON.parse(err.body);
        if (parsed?.error?.data) {
          console.log("Found nested error.data");
          const hex = parsed.error.data;
          console.log("raw revert hex:", hex);
          console.log("decoded:", hexToString(hex));
          return;
        }
      } catch (_) {}
    }

    if (typeof data === "string") {
      console.log("raw revert hex:", data);
      console.log("decoded:", hexToString(data));
    } else {
      console.error("Could not extract revert data from error object. Full error:");
      console.error(err);
    }
  }
}

main().catch((err) => {
  console.error("probeExecute failed:", err?.message ?? err);
  process.exit(1);
});





