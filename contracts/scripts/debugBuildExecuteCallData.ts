// scripts/debugBuildExecuteCallData.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main() {
  const governor = process.env.GOVERNOR_PROXY_ADDRESS;
  const impl = process.env.LAST_IMPL_ADDRESS;
  const salt = process.env.LAST_UPGRADE_SALT;
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!governor || !impl || !salt || !timelock) throw new Error("Set GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS, LAST_UPGRADE_SALT, TIMELOCK_PROXY_ADDRESS in .env");

  const uifs = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uifs.encodeFunctionData("upgradeTo",[impl]);

  console.log("target (governor proxy):", governor);
  console.log("value:", 0);
  console.log("data (hex):", upgradeCalldata);
  console.log("predecessor:", '0x' + '00'.repeat(32));
  console.log("salt:", salt);
  console.log("---- You can paste these into Base Explorer TimelockController.execute(...) ----");
}

main().catch((e)=>{ console.error(e); process.exit(1); });






