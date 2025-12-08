


// scripts/debugSimInnerUpgradeCallDump.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
async function main(){
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS!;
  const governor = process.env.GOVERNOR_PROXY_ADDRESS!;
  const impl = process.env.LAST_IMPL_ADDRESS!;
  const iface = new (hre as any).ethers.Interface(["function upgradeTo(address)"]);
  const calldata = iface.encodeFunctionData("upgradeTo",[impl]);
  try {
    await (hre as any).ethers.provider.call({ to: governor, data: calldata, from: timelock, gasLimit: 5_000_000 });
    console.log("Simulated call succeeded (unexpected)");
  } catch (e:any){
    console.log("Simulated call reverted. raw:", e?.data ?? e?.error?.data ?? e?.body ?? e?.message);
  }
}
main().catch(e=>{console.error(e); process.exit(1);});




