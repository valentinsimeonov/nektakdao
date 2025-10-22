// contracts/scripts/deploy.ts
import fs from "fs";
import path from "path";
import hre from "hardhat";
import { Contract } from "ethers";
import dotenv from "dotenv";
dotenv.config();

/**
 * Deploy script (fixed Timelock constructor)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base_sepolia
 *
 * Ensure contracts/.env contains DEPLOYER_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, etc.
 */

type BigNumberish = any;

interface Allocation { to: string; amount: BigNumberish; }
interface DeploymentConfig {
  tokenName: string;
  governorName: string;
  timelockName: string;
  vestingName: string;
  tokenConstructor: { name: string; symbol: string; initialSupply: BigNumberish; };
  timelockMinDelaySeconds: number;
  timelockProposers: string[];
  timelockExecutors: string[];
  TREASURY_ADDRESS: string | null;
  initialAllocations: Allocation[];
  deployerAssignTo: string | null;
}

const OUTPUT_DIR = (() => {
  const p = path.join(__dirname, "..", "deployments");
  try {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    return p;
  } catch {
    const fallback = "/tmp/nektakdao-deployments";
    if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
    console.warn("[deploy] Warning: cannot create deployments/ in repo - using", fallback);
    return fallback;
  }
})();

const CONFIG: DeploymentConfig = {
  tokenName: "NektakToken",
  governorName: "NektakGovernor",
  timelockName: "TimelockController",
  vestingName: "Vesting",
  tokenConstructor: {
    name: "Nektak Token",
    symbol: "NKT",
    initialSupply: hre.ethers.utils.parseUnits("100000000", 18),
  },
  // For testnets you can set a small delay (e.g. 1) — for production use >= 2 days
  timelockMinDelaySeconds: 1,
  timelockProposers: [], // will grant proposer role to governor below
  timelockExecutors: ["0x0000000000000000000000000000000000000000"],
  TREASURY_ADDRESS: process.env.TREASURY_ADDRESS ? process.env.TREASURY_ADDRESS : null,
  initialAllocations: [],
  deployerAssignTo: process.env.DEPLOYER_ADDRESS || null,
};

type ContractInfo = { address: string };

async function main(): Promise<void> {
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    throw new Error("[deploy] No signers available. Check DEPLOYER_PRIVATE_KEY and hardhat.config.ts");
  }
  const deployer = signers[0];
  console.log("[deploy] Deploying with account:", deployer.address);

  const balBn = await deployer.getBalance();
  const balance = hre.ethers.utils.formatEther(balBn);
  console.log("[deploy] Deployer balance (ETH):", balance);

  const MIN_BALANCE_ETH = 0.0005; // adjust if necessary
  if (parseFloat(balance) < MIN_BALANCE_ETH) {
    throw new Error(`[deploy] Aborting: deployer balance ${balance} ETH < ${MIN_BALANCE_ETH} ETH. Fund the account and retry.`);
  }

  const network = hre.network.name;
  console.log("[deploy] Network:", network);

  const deployments: {
    network: string;
    timestamp: string;
    deployer: string;
    contracts: Record<string, ContractInfo | undefined>;
  } = {
    network,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {}
  };

  // 1) Token
  console.log("\n[1] Deploying Token:", CONFIG.tokenName);
  const TokenFactory = await hre.ethers.getContractFactory(CONFIG.tokenName);
  let token: Contract;
  try {
    token = await TokenFactory.deploy(CONFIG.tokenConstructor.name, CONFIG.tokenConstructor.symbol);
    await token.deployed();
  } catch (err: any) {
    console.error("[deploy] Token deploy failed:", err?.message || err);
    throw err;
  }
  console.log(`[1] ${CONFIG.tokenName} deployed at: ${token.address}`);
  deployments.contracts[CONFIG.tokenName] = { address: token.address };

  // 2) TimelockController — NOTE: pass admin (4th arg)
  console.log("\n[2] Deploying TimelockController:", CONFIG.timelockName);
  const TimelockFactory = await hre.ethers.getContractFactory(CONFIG.timelockName);
  let timelock: Contract;
  try {
    // *** IMPORTANT FIX: add deployer.address as the admin (4th arg)
    timelock = await TimelockFactory.deploy(
      CONFIG.timelockMinDelaySeconds,
      CONFIG.timelockProposers,
      CONFIG.timelockExecutors,
      deployer.address // admin — commonly deployer during bootstrap
    );
    await timelock.deployed();
  } catch (err: any) {
    console.error("[deploy] Timelock deploy failed:", err?.message || err);
    throw err;
  }
  console.log(`[2] ${CONFIG.timelockName} deployed at: ${timelock.address}`);
  deployments.contracts[CONFIG.timelockName] = { address: timelock.address };

  // 3) Governor (token, timelock)
  console.log("\n[3] Deploying Governor:", CONFIG.governorName);
  const GovernorFactory = await hre.ethers.getContractFactory(CONFIG.governorName);
  let governor: Contract;
  try {
    governor = await GovernorFactory.deploy(token.address, timelock.address);
    await governor.deployed();
  } catch (err: any) {
    console.error("[deploy] Governor deploy failed:", err?.message || err);
    throw err;
  }
  console.log(`[3] ${CONFIG.governorName} deployed at: ${governor.address}`);
  deployments.contracts[CONFIG.governorName] = { address: governor.address };

  // 4) Configure timelock roles: grant PROPOSER_ROLE to governor
  console.log("\n[4] Granting PROPOSER_ROLE to governor...");
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const grantTx = await timelock.grantRole(PROPOSER_ROLE, governor.address);
    await grantTx.wait();
    console.log("[4] Granted PROPOSER_ROLE to governor");
  } catch (err: any) {
    console.warn("[4] Warning: could not grant proposer role:", err?.message || err);
  }

  // 5) Optional Vesting
  try {
    console.log("\n[5] Trying to deploy Vesting (if present) ...");
    const VestFactory = await hre.ethers.getContractFactory(CONFIG.vestingName);
    const vest = await VestFactory.deploy(token.address);
    await vest.deployed();
    console.log(`[5] ${CONFIG.vestingName} deployed at: ${vest.address}`);
    deployments.contracts[CONFIG.vestingName] = { address: vest.address };
  } catch {
    console.log("[5] No vesting deployed (skipped).");
  }

  // 6) Transfer token ownership to timelock (if Ownable)
  try {
    console.log("\n[6] Trying to transfer token ownership to timelock...");
    if (typeof (token as any).transferOwnership === "function") {
      const tx = await (token as any).transferOwnership(timelock.address);
      await tx.wait();
      console.log("[6] Token ownership transferred to timelock");
    } else {
      console.log("[6] Token contract doesn't have transferOwnership() - skipping");
    }
  } catch (err: any) {
    console.warn("[6] Token ownership transfer failed/skipped:", err?.message || err);
  }

  // 7) TREASURY note
  if (CONFIG.TREASURY_ADDRESS) {
    console.log(`\n[7] TREASURY_ADDRESS provided: ${CONFIG.TREASURY_ADDRESS}`);
  } else {
    console.log("\n[7] No TREASURY_ADDRESS provided; skipping transfers.");
  }

  // Save summary
  const outPath = path.join(OUTPUT_DIR, `${network}.json`);
  try {
    fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
    console.log("\n[deploy] Deployment summary written to:", outPath);
  } catch (err: any) {
    console.warn("[deploy] Could not write deployments file:", err?.message || err);
    console.log("[deploy] Summary:", JSON.stringify(deployments, null, 2));
  }

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.table(
    Object.entries(deployments.contracts).map(([name, info]) => ({
      Contract: name,
      Address: info?.address ?? "not deployed"
    }))
  );

  console.log("\nVerify hints:");
  console.log(`  npx hardhat verify --network ${network} ${token.address} "${CONFIG.tokenConstructor.name}" "${CONFIG.tokenConstructor.symbol}"`);
  console.log(`  npx hardhat verify --network ${network} ${timelock.address} ${CONFIG.timelockMinDelaySeconds} "[]" '["0x0000000000000000000000000000000000000000"]'`);
  console.log(`  npx hardhat verify --network ${network} ${governor.address} ${token.address} ${timelock.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error("\n" + "=".repeat(60));
    console.error("DEPLOYMENT FAILED");
    console.error("=".repeat(60));
    console.error(err);
    process.exit(1);
  });




  