// scripts/debugCheckAuthorizedAndTimelock.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main(){
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if(!pk) throw new Error("set DEPLOYER_PRIVATE_KEY in .env");
  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);

  const governor = process.env.GOVERNOR_PROXY_ADDRESS;
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if(!governor || !timelock) throw new Error("set GOVERNOR_PROXY_ADDRESS and TIMELOCK_PROXY_ADDRESS in .env");

  // read stored timelock() via ABI (call governor.timelock())
  const gov = await hreEthers.getContractAt("NektakGovernorUpgradeable", governor, wallet) as any;
  let stored;
  try{
    stored = await gov.timelock();
  }catch(e){
    stored = "(call failed) " + (e?.message ?? e);
  }

  // read the impl's storage slot where GovernorTimelockControlUpgradeable stores the timelock
  // It uses an internal variable; we can't easily know its slot. But we will show governor.timelock() result above.
  console.log("governor.timelock() read via ABI:", stored);
  console.log("Simulating delegatecall to upgradeTo(currentImpl) with from=timelock...");

  // get current impl from ERC1967 slot
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const raw = await hreEthers.provider.send("eth_getStorageAt", [governor, implSlot, "latest"]);
  const currentImpl = "0x" + raw.replace(/^0x/, "").slice(24);
  console.log("current implementation (from slot):", currentImpl);

  const iface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const calldata = iface.encodeFunctionData("upgradeTo", [currentImpl]);

  try {
    const res = await hreEthers.provider.call({ to: governor, data: calldata, from: timelock });
    console.log("provider.call succeeded (raw):", res);
  } catch (err: any) {
    console.error("provider.call reverted. raw:", err?.data ?? err?.error?.data ?? err?.message ?? err);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });





