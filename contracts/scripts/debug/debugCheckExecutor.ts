// scripts/debugCheckExecutor.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main(){
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if(!pk) throw new Error("set DEPLOYER_PRIVATE_KEY in .env");
  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if(!timelock) throw new Error("set TIMELOCK_PROXY_ADDRESS in .env");

  const tl = await hreEthers.getContractAt("TimelockControllerUpgradeable", timelock, wallet) as any;
  const EXEC = await tl.EXECUTOR_ROLE();
  const isExec = await tl.hasRole(EXEC, wallet.address);
  console.log("Timelock proxy:", timelock);
  console.log("Executor role:", EXEC);
  console.log("Deployer address:", wallet.address);
  console.log("Deployer has EXECUTOR_ROLE:", isExec);
}

main().catch((e)=>{ console.error(e); process.exit(1); });






