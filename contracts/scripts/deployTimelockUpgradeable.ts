// contracts/scripts/deployTimelockUpgradeable.ts
import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

interface DeploymentData {
  network: string;
  timestamp: string;
  deployer: string;
  contracts: {
    Timelock?: { address: string; minDelay: number };
    Token?: { proxy: string; implementation: string };
    Governor?: { proxy: string; implementation: string };
  };
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function saveDeployment(network: string, deployer: string, updates: any) {
  ensureOutputDir();
  const outPath = path.join(OUTPUT_DIR, `${network}.json`);
  
  let data: DeploymentData = {
    network,
    timestamp: new Date().toISOString(),
    deployer,
    contracts: {},
  };

  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    data = { ...existing, timestamp: new Date().toISOString() };
  }

  data.contracts = { ...data.contracts, ...updates };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`[deploy] Saved to: ${outPath}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = (await ethers.provider.getNetwork()).name;
  
  console.log("=".repeat(60));
  console.log("STEP 1: Deploy TimelockController");
  console.log("=".repeat(60));
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Timelock parameters
  // For Base Sepolia testing: 1 second delay (for quick iteration)
  // For mainnet: use 2 days (172800 seconds)
  const MIN_DELAY = process.env.TIMELOCK_MIN_DELAY 
    ? parseInt(process.env.TIMELOCK_MIN_DELAY) 
    : 1; // 1 second for testnet
  
  // Initially, deployer is both proposer and executor
  // After governor is deployed, we'll grant PROPOSER_ROLE to governor
  const proposers = [deployer.address]; // Temporary, will add Governor later
  const executors = [ethers.ZeroAddress]; // Anyone can execute after timelock
  const admin = deployer.address; // Admin role for initial setup

  console.log("Timelock Config:");
  console.log("  Min Delay:", MIN_DELAY, "seconds");
  console.log("  Initial Proposer:", deployer.address);
  console.log("  Executors: [anyone]");
  console.log();

  console.log("Deploying TimelockControllerUpgradeable...");
  
  // const TimelockFactory = await ethers.getContractFactory("TimelockControllerUpgradeable");
  const TimelockFactory = await ethers.getContractFactory("TimelockControllerUpgradeableUUPS");
  const timelock = await upgrades.deployProxy(
    TimelockFactory,
    [MIN_DELAY, proposers, executors, admin],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();

  console.log("Timelock Proxy deployed at:", timelockAddress);
  
  // Get implementation address
  const implAddress = await upgrades.erc1967.getImplementationAddress(timelockAddress);
  console.log("   Implementation at:", implAddress);
  console.log();

  // Save deployment
  saveDeployment(network, deployer.address, {
    Timelock: {
      address: timelockAddress,
      minDelay: MIN_DELAY,
    },
  });

  console.log("=".repeat(60));
  console.log("STEP 1 COMPLETE");
  console.log("=".repeat(60));
  console.log("Next: Run deploy-2-token.ts");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });