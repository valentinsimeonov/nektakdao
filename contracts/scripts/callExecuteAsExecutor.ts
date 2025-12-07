// scripts/callExecuteAsExecutor.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main(){
  const pk = process.env.EXECUTOR_PRIVATE_KEY;
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  const governor = process.env.GOVERNOR_PROXY_ADDRESS;
  const impl = process.env.LAST_IMPL_ADDRESS;
  const salt = process.env.LAST_UPGRADE_SALT;
  if (!pk || !timelock || !governor || !impl || !salt) throw new Error("Set EXECUTOR_PRIVATE_KEY, TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS, LAST_UPGRADE_SALT");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const uifs = new hreEthers.Interface(["function upgradeTo(address)"]);
  const calld = uifs.encodeFunctionData("upgradeTo",[impl]);

  const tlIfaceSingle = new hreEthers.Interface([
    "function execute(address,uint256,bytes,bytes32,bytes32)"
  ]);
  const predecessor = '0x' + '00'.repeat(32);
  const execCalldata = tlIfaceSingle.encodeFunctionData("execute",[governor,0,calld,predecessor,salt]);

  console.log("Calling timelock.execute(...) as executor:", wallet.address);
  const tx = await wallet.sendTransaction({ to: timelock, data: execCalldata });
  console.log("tx hash:", tx.hash);
  const rcpt = await tx.wait();
  console.log("mined, status:", rcpt.status, "tx:", rcpt.transactionHash);
}

main().catch((e)=>{ console.error(e); process.exit(1); });






