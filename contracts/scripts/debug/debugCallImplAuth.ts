// scripts/debugCallImplAuth.ts
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

  const impl = process.env.LAST_IMPL_ADDRESS ?? process.env.GOVERNOR_IMPL_ADDRESS;
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS ?? deployments?.Timelock?.proxy ?? deployments?.Timelock?.address;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy;

  if (!impl || !timelock || !governorProxy) throw new Error("Set LAST_IMPL_ADDRESS (or GOVERNOR_IMPL_ADDRESS), TIMELOCK_PROXY_ADDRESS, and GOVERNOR_PROXY_ADDRESS in .env");

  // Build upgrade calldata
  const uupsIface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [impl]);

  console.log("Simulating calling upgradeTo on implementation address but with from=timelock (as proxy would).");
  console.log("impl:", impl, "timelock (as msg.sender):", timelock, "governorProxy (as target for delegatecall):", governorProxy);

  // The proxy delegates to implementation, so calling the implementation directly isn't identical.
  // But many implementations check only msg.sender against their stored timelock, so we simulate calling the implementation with from=timelock:
  try {
    const res = await hreEthers.provider.call({ to: impl, data: upgradeCalldata, from: timelock });
    console.log("provider.call succeeded (raw):", res);
    console.log("That suggests _authorizeUpgrade did not revert when called from timelock.");
  } catch (err: any) {
    console.error("provider.call reverted when calling implementation. raw:", err?.data ?? err?.error?.data ?? err?.message ?? err);
    // decode error string if present
    const raw = err?.data ?? err?.error?.data ?? null;
    if (raw) {
      if (typeof raw === "string" && raw.startsWith("0x08c379a0")) {
        // decode Error(string)
        const lenHex = raw.slice(10 + 64, 10 + 64 + 64);
        const len = parseInt(lenHex, 16) * 2;
        const strHex = raw.slice(10 + 64 + 64, 10 + 64 + 64 + len);
        console.log("Decoded revert string:", Buffer.from(strHex, "hex").toString("utf8"));
      } else {
        console.log("raw revert hex:", raw);
      }
    }
  }
}

main().catch((err) => { console.error("debugCallImplAuth failed:", err?.message ?? err); process.exit(1); });




