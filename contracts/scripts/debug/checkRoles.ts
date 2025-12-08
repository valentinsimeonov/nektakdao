// scripts/checkRoles.ts
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
  console.log("Network:", networkName, "using deployer:", wallet.address);

  const deployments = readDeployment(networkName);
  const timelockAddr =
    process.env.TIMELOCK_PROXY_ADDRESS ??
    deployments?.Timelock?.proxy ??
    deployments?.Timelock?.address;

  if (!timelockAddr) {
    throw new Error("Could not find timelock address. Set TIMELOCK_PROXY_ADDRESS or add deployments/<network>.json");
  }
  console.log("Timelock proxy:", timelockAddr);

  // Connect to timelock contract
  const timelock = await hreEthers.getContractAt("TimelockControllerUpgradeable", timelockAddr, wallet) as any;

  // Print min delay
  try {
    const minDelay = await timelock.getMinDelay();
    console.log("getMinDelay():", minDelay.toString(), "seconds");
  } catch (e) {
    console.warn("Could not call getMinDelay():", (e as any).message ?? e);
  }

  // Print PROPOSER_ROLE and whether deployer has it
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const hasProposer = await timelock.hasRole(PROPOSER_ROLE, wallet.address);
    console.log("PROPOSER_ROLE (bytes32):", PROPOSER_ROLE);
    console.log(`Deployer has PROPOSER_ROLE: ${hasProposer}`);
  } catch (e) {
    console.warn("Could not read PROPOSER_ROLE/hasRole:", (e as any).message ?? e);
    console.log("If the contract doesn't expose role constants via ABI, you can compute them off-chain:");
    console.log("  PROPOSER_ROLE = hreEthers.keccak256(hreEthers.toUtf8Bytes('PROPOSER_ROLE'))");
  }

  // Optionally show DEFAULT_ADMIN_ROLE and EXECUTOR_ROLE
  try {
    const ADMIN = await timelock.DEFAULT_ADMIN_ROLE();
    const EXEC = await timelock.EXECUTOR_ROLE();
    console.log("DEFAULT_ADMIN_ROLE:", ADMIN);
    console.log("EXECUTOR_ROLE:", EXEC);
  } catch (_) {}
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("checkRoles failed:", err?.message ?? err);
    process.exit(1);
  });




  