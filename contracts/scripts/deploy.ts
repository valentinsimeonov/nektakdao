import fs from "fs";
import path from "path";
import hre from "hardhat";
import { BigNumber } from "ethers";
import dotenv from "dotenv";
dotenv.config();

/**
 * Deployment scaffold for Nektak DAO (Hardhat + ethers v5)
 *
 * NOTES:
 * - This script expects compiled contract artifacts in `artifacts/` (run `npx hardhat compile` first).
 * - Edit CONFIG below to match your contract names and desired deployment parameters.
 * - Replace placeholder addresses (e.g., TREASURY_ADDRESS) with your Safe or deployer.
 * - This script does not attempt to verify contracts on block explorers (you can run hardhat-etherscan verify separately).
 */

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const CONFIG = {
  // Contract names as they appear in your solidity source (Factory names)
  tokenName: "NektakToken", // change if your contract name differs
  governorName: "NektakGovernor", // change if your Governor contract name differs
  timelockName: "TimelockController", // usually OpenZeppelin TimelockController
  vestingName: "Vesting", // optional vesting contract name

  // Token constructor args
  tokenConstructor: {
    name: "Nektak Token",
    symbol: "NKT",
    // optional: initial supply minted by constructor (most ERC20Votes do NOT mint in constructor)
    initialSupply: hre.ethers.utils.parseUnits("100000000", 18) // example 100M
  },

  // Timelock parameters
  timelockMinDelaySeconds: 48 * 3600, // 48 hours default; use 7*24*3600 for upgrades
  timelockProposers: [], // to be filled with governor address after deploy
  timelockExecutors: ["0x0000000000000000000000000000000000000000"], // address(0) -> allow anyone execute (common pattern)

  // Treasury address (preferably Gnosis Safe address)
  TREASURY_ADDRESS: process.env.TREASURY_ADDRESS || null, // set in .env or replace

  // Initial distribution (example, fill with real addresses for your team/treasury)
  initialAllocations: [
    // { to: "0x...", amount: hre.ethers.utils.parseUnits("40000000", 18) } // treasury 40M example
  ],

  // Optional: if you want the deployer to be a temporary multisig or owner
  deployerAssignTo: process.env.DEPLOYER_ADDRESS || null
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("Deployer ETH balance:", hre.ethers.utils.formatEther(balance));

  const network = hre.network.name;
  console.log("Network:", network);

  const deployments: Record<string, any> = {
    network,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {}
  };

  // 1) Deploy Token (ERC20Votes)
  console.log("\n1) Deploying Token...");
  const TokenFactory = await hre.ethers.getContractFactory(CONFIG.tokenName);
  // If your token contract constructor expects (name, symbol) only, adapt below:
  let token;
  try {
    token = await TokenFactory.deploy(CONFIG.tokenConstructor.name, CONFIG.tokenConstructor.symbol);
  } catch (err) {
    // fallback if token constructor takes initial supply
    token = await TokenFactory.deploy(
      CONFIG.tokenConstructor.name,
      CONFIG.tokenConstructor.symbol,
      CONFIG.tokenConstructor.initialSupply
    );
  }
  await token.deployed();
  console.log(`${CONFIG.tokenName} deployed at:`, token.address);
  deployments.contracts[CONFIG.tokenName] = { address: token.address };

  // 1b) Optionally mint initial allocations if your token has a mint function and token owner is deployer
  if (CONFIG.initialAllocations && CONFIG.initialAllocations.length > 0) {
    console.log("Minting initial allocations...");
    for (const alloc of CONFIG.initialAllocations) {
      const tx = await token.mint(alloc.to, alloc.amount);
      await tx.wait();
      console.log(`  minted ${alloc.to} -> ${hre.ethers.utils.formatUnits(alloc.amount, 18)}`);
    }
  } else {
    console.log("No initial allocations configured in script. Use governance to mint later if token is mintable.");
  }

  // 2) Deploy TimelockController
  console.log("\n2) Deploying TimelockController...");
  const TimelockFactory = await hre.ethers.getContractFactory(CONFIG.timelockName);
  // timelock constructor: (minDelay, proposers[], executors[])
  const timelock = await TimelockFactory.deploy(
    CONFIG.timelockMinDelaySeconds,
    CONFIG.timelockProposers,
    CONFIG.timelockExecutors
  );
  await timelock.deployed();
  console.log(`${CONFIG.timelockName} deployed at:`, timelock.address);
  deployments.contracts[CONFIG.timelockName] = { address: timelock.address };

  // 3) Deploy Governor
  console.log("\n3) Deploying Governor...");
  const GovernorFactory = await hre.ethers.getContractFactory(CONFIG.governorName);

  /**
   * NOTE: OpenZeppelin's Governor constructors vary depending on your implementation.
   * Common pattern:
   *   new Governor(name, tokenAddress, votingDelay, votingPeriod, proposalThreshold)
   *
   * If your Governor takes a Timelock address, pass it accordingly. Update args below to match your governor's constructor.
   */
  let governor;
  try {
    // attempt: Governor(name, token.address, timelock.address)
    governor = await GovernorFactory.deploy(CONFIG.governorName, token.address, timelock.address);
  } catch (err) {
    // fallback: try a simpler constructor (token only)
    governor = await GovernorFactory.deploy(token.address);
  }
  await governor.deployed();
  console.log(`${CONFIG.governorName} deployed at:`, governor.address);
  deployments.contracts[CONFIG.governorName] = { address: governor.address };

  // 4) Set Timelock proposers/executors to Governor if desired
  // If your Timelock requires giving proposer/executor roles explicitly, do so here.
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE ? await timelock.TIMELOCK_ADMIN_ROLE() : null;

    console.log("Timelock roles read:", {
      PROPOSER_ROLE,
      EXECUTOR_ROLE,
      ADMIN_ROLE
    });

    // Grant PROPOSER to governor
    const grantTx = await timelock.grantRole(PROPOSER_ROLE, governor.address);
    await grantTx.wait();
    console.log("Granted PROPOSER role to Governor.");

    // Optionally grant EXECUTOR to address(0) or particular addresses (already set in constructor)
  } catch (err) {
    console.log("Warning: could not auto-configure timelock roles (check timelock implementation). Err:", err.message || err);
  }

  // 5) Vesting contract (optional)
  try {
    console.log("\n5) Deploying Vesting contract (optional)...");
    const VestFactory = await hre.ethers.getContractFactory(CONFIG.vestingName);
    const vest = await VestFactory.deploy(token.address /* add vesting constructor args if needed */);
    await vest.deployed();
    console.log(`${CONFIG.vestingName} deployed at:`, vest.address);
    deployments.contracts[CONFIG.vestingName] = { address: vest.address };
  } catch (err) {
    console.log("No vesting deployed (skipped). If you want a vesting contract, update the script to pass constructor args. Err:", err.message || err);
  }

  // 6) Transfer token ownership to timelock (if token is Ownable)
  try {
    if (typeof token.transferOwnership === "function") {
      console.log("Transferring token ownership to timelock...");
      const tx = await token.transferOwnership(timelock.address);
      await tx.wait();
      console.log("Token ownership transferred to Timelock.");
    } else {
      console.log("Token has no transferOwnership() - perhaps not Ownable.");
    }
  } catch (err) {
    console.log("Token ownership transfer skipped or failed (safe to ignore if not applicable). Err:", err.message || err);
  }

  // 7) Optionally, transfer treasury allocations to TREASURY_ADDRESS
  if (CONFIG.TREASURY_ADDRESS) {
    try {
      console.log(`\n7) Transferring initial treasury tokens to ${CONFIG.TREASURY_ADDRESS} (if any)...`);
      // compute balance of this deployer or minted supply - adjust as needed
      // Example: send X tokens (here we do nothing by default)
      // await token.transfer(CONFIG.TREASURY_ADDRESS, someAmount);
      console.log("No auto-transfer implemented; implement as needed in script.");
    } catch (err) {
      console.log("Treasury transfer attempt failed:", err.message || err);
    }
  }

  // 8) Persist deployment info
  const OUT_PATH = path.join(OUTPUT_DIR, `${network}.json`);
  fs.writeFileSync(OUT_PATH, JSON.stringify(deployments, null, 2));
  console.log("\nDeployment summary written to:", OUT_PATH);

  console.log("\nAll done. Contracts deployed:");
  console.table(
    Object.entries(deployments.contracts).map(([name, meta]) => ({
      contract: name,
      address: meta.address
    }))
  );

  console.log("\nNext steps:");
  console.log(" - Verify contracts on block explorer (hardhat-etherscan plugin).");
  console.log(" - Add addresses to docs/deployments.md and frontend env.");
  console.log(" - If using a Safe treasury, update TREASURY_ADDRESS and fund the Safe.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment script error:", error);
    process.exit(1);
  });
