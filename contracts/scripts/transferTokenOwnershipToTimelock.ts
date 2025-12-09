// scripts/transferTokenOwnershipToTimelock.ts
import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {

    
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in env");
  const deployer = new ethers.Wallet(pk, ethers.provider);
  const net = await ethers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  const deployFile = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  if (!fs.existsSync(deployFile)) throw new Error("deployments file missing: " + deployFile);
  const d = JSON.parse(fs.readFileSync(deployFile, "utf8"));
  const tokenProxy = d.Token?.proxy ?? d.Token?.address;
  if (!tokenProxy) throw new Error("Token proxy not found in deployments file");
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS ?? d.contracts?.Timelock?.address ?? d.Timelock?.address;
  if (!timelockAddr) throw new Error("TIMELOCK_PROXY_ADDRESS missing in env and deployments file");

  const Token = await hre.ethers.getContractFactory("NektakTokenUpgradeable", deployer);
  const token = Token.attach(tokenProxy).connect(deployer) as any;

  const currentOwner = await token.owner().catch(() => null);
  console.log("Current owner:", currentOwner);
  if (currentOwner && currentOwner.toLowerCase() === timelockAddr.toLowerCase()) {
    console.log("Already owned by timelock; nothing to do.");
    return;
  }
  const tx = await token.transferOwnership(timelockAddr);
  console.log("transferOwnership tx:", tx.hash);
  await tx.wait();
  console.log("transferOwnership mined. new owner should be:", timelockAddr);
}

main().catch((e)=>{ console.error(e); process.exit(1); });




