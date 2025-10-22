// contracts/scripts/deploy.ts
import fs from "fs";
import path from "path";
import hre from "hardhat";
import { Contract } from "ethers";
import dotenv from "dotenv";
dotenv.config();

/**
 * Robust TypeScript deployment script for Nektak DAO
 *
 * Usage:
 *  npx hardhat run scripts/deploy.ts --network base_sepolia
 *
 * Required env variables:
 *  - DEPLOYER_PRIVATE_KEY (0x... format)
 *  - ETHERSCAN_KEY (optional, for verification)
 *  - BASE_SEPOLIA_RPC_URL
 *  - TREASURY_ADDRESS (optional)
 */

type BigNumberish = any;

interface Allocation { to: string; amount: BigNumberish; }
interface DeploymentConfig {
  tokenName: string; governorName: string; timelockName: string; vestingName: string;
  tokenConstructor: { name: string; symbol: string; initialSupply: BigNumberish; };
  timelockMinDelaySeconds: number; timelockProposers: string[]; timelockExecutors: string[];
  TREASURY_ADDRESS: string | null; initialAllocations: Allocation[]; deployerAssignTo: string | null;
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
  timelockMinDelaySeconds: 48 * 3600,
  timelockProposers: [],
  timelockExecutors: ["0x0000000000000000000000000000000000000000"],
  TREASURY_ADDRESS: process.env.TREASURY_ADDRESS ? process.env.TREASURY_ADDRESS : null,
  initialAllocations: [],
  deployerAssignTo: process.env.DEPLOYER_ADDRESS || null,
};

type ContractInfo = { address: string };

async function main(): Promise<void> {
  // ENSURE we have at least one signer available
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    throw new Error(
      "[deploy] No signers available. For external networks, ensure DEPLOYER_PRIVATE_KEY is set in .env and hardhat.config.ts uses it in the network.accounts."
    );
  }
  const deployer = signers[0];
  console.log("[deploy] Deploying with account:", deployer.address);

  const bal = await deployer.getBalance();
  console.log("[deploy] Deployer balance (ETH):", hre.ethers.utils.formatEther(bal));

  const network = hre.network.name;
  console.log("[deploy] Network:", network);

  const deployments: {
    network: string; timestamp: string; deployer: string; contracts: Record<string, ContractInfo | undefined>;
  } = {
    network, timestamp: new Date().toISOString(), deployer: deployer.address, contracts: {}
  };

  // 1) Token
  console.log("\n[1] Deploying Token:", CONFIG.tokenName);
  const TokenFactory = await hre.ethers.getContractFactory(CONFIG.tokenName);
  let token: Contract;
  try {
    token = await TokenFactory.deploy(CONFIG.tokenConstructor.name, CONFIG.tokenConstructor.symbol);
    await token.deployed();
  } catch (err) {
    console.log("[deploy] Fallback: trying constructor with initialSupply...");
    token = await TokenFactory.deploy(
      CONFIG.tokenConstructor.name,
      CONFIG.tokenConstructor.symbol,
      CONFIG.tokenConstructor.initialSupply
    );
    await token.deployed();
  }
  console.log(`[1] ${CONFIG.tokenName} deployed at: ${token.address}`);
  deployments.contracts[CONFIG.tokenName] = { address: token.address };

  // Optional initial allocations (mint)
  if (Array.isArray(CONFIG.initialAllocations) && CONFIG.initialAllocations.length > 0) {
    console.log("[1b] Minting initial allocations...");
    for (const alloc of CONFIG.initialAllocations) {
      const tx = await token.mint(alloc.to, alloc.amount);
      await tx.wait();
      console.log(`  minted ${hre.ethers.utils.formatUnits(alloc.amount, 18)} to ${alloc.to}`);
    }
  } else {
    console.log("[1b] No initial allocations configured.");
  }

  // 2) Timelock
  console.log("\n[2] Deploying TimelockController:", CONFIG.timelockName);
  const TimelockFactory = await hre.ethers.getContractFactory(CONFIG.timelockName);
  const timelock: Contract = await TimelockFactory.deploy(
    CONFIG.timelockMinDelaySeconds,
    CONFIG.timelockProposers,
    CONFIG.timelockExecutors
  );
  await timelock.deployed();
  console.log(`[2] ${CONFIG.timelockName} deployed at: ${timelock.address}`);
  deployments.contracts[CONFIG.timelockName] = { address: timelock.address };

  // 3) Governor
  console.log("\n[3] Deploying Governor:", CONFIG.governorName);
  const GovernorFactory = await hre.ethers.getContractFactory(CONFIG.governorName);
  const governor: Contract = await GovernorFactory.deploy(token.address, timelock.address);
  await governor.deployed();
  console.log(`[3] ${CONFIG.governorName} deployed at: ${governor.address}`);
  deployments.contracts[CONFIG.governorName] = { address: governor.address };

  // 4) Configure Timelock roles
  console.log("\n[4] Configuring timelock roles...");
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    console.log("[4] fetched roles:", { PROPOSER_ROLE, EXECUTOR_ROLE, TIMELOCK_ADMIN_ROLE });

    const grantTx = await timelock.grantRole(PROPOSER_ROLE, governor.address);
    await grantTx.wait();
    console.log("[4] Granted PROPOSER_ROLE to governor");
  } catch (err: any) {
    console.warn("[4] Warning: could not fully configure timelock roles:", err?.message || err);
  }

  // 5) Vesting (optional)
  try {
    console.log("\n[5] Deploying Vesting (optional) ...");
    const VestFactory = await hre.ethers.getContractFactory(CONFIG.vestingName);
    const vest: Contract = await VestFactory.deploy(token.address);
    await vest.deployed();
    console.log(`[5] ${CONFIG.vestingName} deployed at: ${vest.address}`);
    deployments.contracts[CONFIG.vestingName] = { address: vest.address };
  } catch (err: any) {
    console.log("[5] Vesting skipped or not present:", err?.message || err);
  }

  // 6) Transfer token ownership to timelock (if Ownable)
  try {
    console.log("\n[6] Transferring token ownership to timelock (if supported)...");
    if (typeof token.transferOwnership === "function") {
      const tx = await token.transferOwnership(timelock.address);
      await tx.wait();
      console.log("[6] Token ownership transferred to timelock");
    } else {
      console.log("[6] Token contract has no transferOwnership() - skipping");
    }
  } catch (err: any) {
    console.log("[6] Token ownership transfer skipped or failed:", err?.message || err);
  }

  // 7) TREASURY handling
  if (CONFIG.TREASURY_ADDRESS) {
    console.log(`\n[7] TREASURY_ADDRESS provided: ${CONFIG.TREASURY_ADDRESS}`);
    // No auto-transfer by default. If you want one, uncomment lines below and set amount.
    // await token.transfer(CONFIG.TREASURY_ADDRESS, hre.ethers.utils.parseUnits("1000", 18));
  } else {
    console.log("\n[7] No TREASURY_ADDRESS provided; skipping treasury transfers.");
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

  // Final summary table
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.table(
    Object.entries(deployments.contracts).map(([name, info]) => ({
      Contract: name,
      Address: info?.address ?? "not deployed",
    }))
  );

  // Verify hints
  console.log("\nSuggested verify commands:");
  console.log(`  npx hardhat verify --network ${network} ${token.address} "${CONFIG.tokenConstructor.name}" "${CONFIG.tokenConstructor.symbol}"`);
  console.log(
    `  npx hardhat verify --network ${network} ${timelock.address} ${CONFIG.timelockMinDelaySeconds} "[]" '["0x0000000000000000000000000000000000000000"]'`
  );
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





  