// scripts/grantExecutorToAnyone.ts
import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in env");
  const signer = new ethers.Wallet(pk, ethers.provider);

  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelockAddr) throw new Error("TIMELOCK_PROXY_ADDRESS missing in env");

  const timelock = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr, signer) as any;
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  const zero = ethers.ZeroAddress;
  const already = await timelock.hasRole(EXECUTOR_ROLE, zero);
  console.log("zero-address already executor?:", already);

  if (!already) {
    const tx = await timelock.grantRole(EXECUTOR_ROLE, zero);
    console.log("grant tx:", tx.hash);
    await tx.wait();
    console.log("Granted EXECUTOR_ROLE to zero address (anyone can execute)");
  } else {
    console.log("No-op: zero address is already executor");
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });





