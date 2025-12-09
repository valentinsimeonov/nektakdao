// scripts/debugReadRoles.ts
import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
  // Determine deployer/signer (prefer DEPLOYER_PRIVATE_KEY if available)
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  let signer: any;
  let deployerAddress: string | undefined;

  if (pk && pk !== "") {
    signer = new ethers.Wallet(pk, ethers.provider);
    deployerAddress = signer.address;
  } else {
    // fallback to provider's first account (if available)
    const accounts = await ethers.provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error("No deployer private key and provider returned no accounts.");
    }
    deployerAddress = accounts[0];
    signer = ethers.provider.getSigner(deployerAddress);
  }

  // Locate timelock address (env first, then deployments/<network>.json)
  const networkObj = await ethers.provider.getNetwork();
  const network = networkObj.name || String(networkObj.chainId);

  let timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  const deployFile = path.join(__dirname, "..", "deployments", `${network}.json`);

  if (!timelockAddr && fs.existsSync(deployFile)) {
    try {
      const d = JSON.parse(fs.readFileSync(deployFile, "utf8"));
      timelockAddr = d.contracts?.Timelock?.address ?? d.Timelock?.address ?? timelockAddr;
    } catch (e) {
      /* ignore parse errors */
    }
  }

  if (!timelockAddr) throw new Error("TIMELOCK_PROXY_ADDRESS not found in env or deployments file.");

  const timelock = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr, signer);
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  console.log("Timelock:", timelockAddr);
  console.log("PROPOSER_ROLE:", PROPOSER_ROLE);
  console.log("EXECUTOR_ROLE:", EXECUTOR_ROLE);
  console.log("Deployer address used:", deployerAddress);
  console.log("deployer has PROPOSER_ROLE:", await timelock.hasRole(PROPOSER_ROLE, deployerAddress));
  console.log("anyone (zero address) has EXECUTOR_ROLE:", await timelock.hasRole(EXECUTOR_ROLE, ethers.ZeroAddress));
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});