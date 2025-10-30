// contracts/scripts/deploy.ts
import fs from "fs";
import path from "path";
import hre from "hardhat";
import { Contract } from "ethers";
import dotenv from "dotenv";
dotenv.config();

/**
 * Deploy script for Nektak DAO with proper nonce management
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base_sepolia
 */

type BigNumberish = any;

interface Allocation { 
  to: string; 
  amount: BigNumberish; 
}

interface DeploymentConfig {
  tokenName: string;
  governorName: string;
  timelockName: string;
  vestingName: string;
  tokenConstructor: { 
    name: string; 
    symbol: string; 
    initialSupply: BigNumberish; 
  };
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
  // For testnets: 1 second, For production: 172800 (48 hours)
  timelockMinDelaySeconds: 1,
  timelockProposers: [],
  timelockExecutors: ["0x0000000000000000000000000000000000000000"],
  TREASURY_ADDRESS: process.env.TREASURY_ADDRESS || null,
  initialAllocations: [],
  deployerAssignTo: process.env.DEPLOYER_ADDRESS || null,
};

type ContractInfo = { address: string };

// Helper function to get gas settings
async function getGasSettings() {
  const feeData = await hre.ethers.provider.getFeeData();
  const defaultPriority = feeData.maxPriorityFeePerGas ?? hre.ethers.utils.parseUnits("1", "gwei");
  const defaultMaxFee = feeData.maxFeePerGas ?? hre.ethers.utils.parseUnits("50", "gwei");
  
  return {
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      ? feeData.maxPriorityFeePerGas.mul(12).div(10)
      : defaultPriority,
    maxFeePerGas: feeData.maxFeePerGas
      ? feeData.maxFeePerGas.mul(12).div(10)
      : defaultMaxFee,
  };
}

// Helper to wait between deployments
async function waitForConfirmation(contract: Contract, confirmations: number = 1) {
  console.log(`[deploy] Waiting for ${confirmations} confirmation(s)...`);
  await contract.deployTransaction.wait(confirmations);
  // Add small delay to let nonce sync
  await new Promise(resolve => setTimeout(resolve, 2000));
}

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

  const MIN_BALANCE_ETH = 0.0005;
  if (parseFloat(balance) < MIN_BALANCE_ETH) {
    throw new Error(`[deploy] Insufficient balance: ${balance} ETH < ${MIN_BALANCE_ETH} ETH`);
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

  // Get gas settings once for all deployments
  const gasSettings = await getGasSettings();
  console.log("[deploy] Gas settings:", {
    maxPriorityFeePerGas: hre.ethers.utils.formatUnits(gasSettings.maxPriorityFeePerGas, "gwei"),
    maxFeePerGas: hre.ethers.utils.formatUnits(gasSettings.maxFeePerGas, "gwei"),
  });

  // ===== 1) Deploy Token =====
  console.log("\n[1] Deploying Token:", CONFIG.tokenName);
  const TokenFactory = await hre.ethers.getContractFactory(CONFIG.tokenName);
  let token: Contract;
  
  try {
    const tokenNonce = await deployer.getTransactionCount("pending");
    console.log(`[1] Using nonce: ${tokenNonce}`);
    
    token = await TokenFactory.deploy(
      CONFIG.tokenConstructor.name,
      CONFIG.tokenConstructor.symbol,
      {
        nonce: tokenNonce,
        ...gasSettings,
      }
    );
    
    console.log(`[1] Token deployment transaction sent: ${token.deployTransaction.hash}`);
    await waitForConfirmation(token, 1);
    console.log(`[1] ${CONFIG.tokenName} deployed at: ${token.address}`);
    
  } catch (err: any) {
    console.error("[1] Token deploy failed:", err?.message || err);
    throw err;
  }
  
  deployments.contracts[CONFIG.tokenName] = { address: token.address };

  // ===== 2) Deploy TimelockController =====
  console.log("\n[2] Deploying TimelockController:", CONFIG.timelockName);
  const TimelockFactory = await hre.ethers.getContractFactory(CONFIG.timelockName);
  let timelock: Contract;
  
  try {
    const timelockNonce = await deployer.getTransactionCount("pending");
    console.log(`[2] Using nonce: ${timelockNonce}`);
    
    timelock = await TimelockFactory.deploy(
      CONFIG.timelockMinDelaySeconds,
      CONFIG.timelockProposers,
      CONFIG.timelockExecutors,
      deployer.address, // admin
      {
        nonce: timelockNonce,
        ...gasSettings,
      }
    );
    
    console.log(`[2] Timelock deployment transaction sent: ${timelock.deployTransaction.hash}`);
    await waitForConfirmation(timelock, 1);
    console.log(`[2] ${CONFIG.timelockName} deployed at: ${timelock.address}`);
    
  } catch (err: any) {
    console.error("[2] Timelock deploy failed:", err?.message || err);
    throw err;
  }
  
  deployments.contracts[CONFIG.timelockName] = { address: timelock.address };

  // ===== 3) Deploy Governor =====
  console.log("\n[3] Deploying Governor:", CONFIG.governorName);
  const GovernorFactory = await hre.ethers.getContractFactory(CONFIG.governorName);
  let governor: Contract;
  
  try {
    const governorNonce = await deployer.getTransactionCount("pending");
    console.log(`[3] Using nonce: ${governorNonce}`);
    
    governor = await GovernorFactory.deploy(
      token.address,
      timelock.address,
      {
        nonce: governorNonce,
        ...gasSettings,
      }
    );
    
    console.log(`[3] Governor deployment transaction sent: ${governor.deployTransaction.hash}`);
    await waitForConfirmation(governor, 1);
    console.log(`[3] ${CONFIG.governorName} deployed at: ${governor.address}`);
    
  } catch (err: any) {
    console.error("[3] Governor deploy failed:", err?.message || err);
    throw err;
  }
  
  deployments.contracts[CONFIG.governorName] = { address: governor.address };

  // ===== 4) Configure Timelock Roles =====
  console.log("\n[4] Configuring Timelock roles...");
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const currentNonce = await deployer.getTransactionCount("pending");
    
    const grantTx = await timelock.grantRole(PROPOSER_ROLE, governor.address, {
      nonce: currentNonce,
      ...gasSettings,
    });
    await grantTx.wait();
    console.log("[4] ✓ Granted PROPOSER_ROLE to Governor");
  } catch (err: any) {
    console.warn("[4] Warning: could not grant proposer role:", err?.message || err);
  }

  // ===== 5) Optional: Deploy Vesting =====
  try {
    console.log("\n[5] Deploying Vesting contract...");
    const VestFactory = await hre.ethers.getContractFactory(CONFIG.vestingName);
    const vestNonce = await deployer.getTransactionCount("pending");
    
    const vest = await VestFactory.deploy(token.address, {
      nonce: vestNonce,
      ...gasSettings,
    });
    await waitForConfirmation(vest, 1);
    
    console.log(`[5] ${CONFIG.vestingName} deployed at: ${vest.address}`);
    deployments.contracts[CONFIG.vestingName] = { address: vest.address };
  } catch (err: any) {
    console.log("[5] Vesting deployment skipped:", err?.message || err);
  }

  // ===== 6) Transfer Token Ownership =====
  try {
    console.log("\n[6] Transferring token ownership to Timelock...");
    if (typeof (token as any).transferOwnership === "function") {
      const currentNonce = await deployer.getTransactionCount("pending");
      const tx = await (token as any).transferOwnership(timelock.address, {
        nonce: currentNonce,
        ...gasSettings,
      });
      await tx.wait();
      console.log("[6] ✓ Token ownership transferred to Timelock");
    } else {
      console.log("[6] Token doesn't have transferOwnership() - skipping");
    }
  } catch (err: any) {
    console.warn("[6] Token ownership transfer failed:", err?.message || err);
  }

  // ===== 7) Save Deployment Info =====
  const outPath = path.join(OUTPUT_DIR, `${network}.json`);
  try {
    fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));
    console.log("\n[deploy] ✓ Deployment summary saved:", outPath);
  } catch (err: any) {
    console.warn("[deploy] Could not write file:", err?.message || err);
    console.log("\n[deploy] Deployment data:");
    console.log(JSON.stringify(deployments, null, 2));
  }

  // ===== Summary =====
  console.log("\n" + "=".repeat(70));
  console.log("                    DEPLOYMENT SUCCESSFUL");
  console.log("=".repeat(70));
  
  console.table(
    Object.entries(deployments.contracts).map(([name, info]) => ({
      Contract: name,
      Address: info?.address ?? "not deployed"
    }))
  );

  console.log("\n Contract Verification Commands:\n");
  console.log(`Token:`);
  console.log(`  npx hardhat verify --network ${network} ${token.address} "${CONFIG.tokenConstructor.name}" "${CONFIG.tokenConstructor.symbol}"\n`);
  
  console.log(`Timelock:`);
  console.log(`  npx hardhat verify --network ${network} ${timelock.address} ${CONFIG.timelockMinDelaySeconds} "[]" '["0x0000000000000000000000000000000000000000"]' "${deployer.address}"\n`);
  
  console.log(`Governor:`);
  console.log(`  npx hardhat verify --network ${network} ${governor.address} ${token.address} ${timelock.address}\n`);

  if (deployments.contracts[CONFIG.vestingName]) {
    console.log(`Vesting:`);
    console.log(`  npx hardhat verify --network ${network} ${deployments.contracts[CONFIG.vestingName]?.address} ${token.address}\n`);
  }

  console.log("=".repeat(70));
  console.log("All deployments complete! Next steps:");
  console.log("  1. Verify contracts on BaseScan (commands above)");
  console.log("  2. Save addresses to documentation");
  console.log("  3. Test governance flow");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    console.error("\n" + "=".repeat(70));
    console.error("DEPLOYMENT FAILED");
    console.error("=".repeat(70));
    console.error(err);
    process.exit(1);
  });




