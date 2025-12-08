// scripts/tryExecuteArray.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const ethers = (hre as any).ethers;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");

  const wallet = new ethers.Wallet(pk, ethers.provider);
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "from", wallet.address);

  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS!;
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS!;
  const impl = process.env.LAST_IMPL_ADDRESS!;
  const salt = process.env.LAST_UPGRADE_SALT!;

  if (!timelockAddr || !governorProxy || !impl || !salt) {
    throw new Error("Ensure TIMELOCK_PROXY_ADDRESS, GOVERNOR_PROXY_ADDRESS, LAST_IMPL_ADDRESS, LAST_UPGRADE_SALT are in .env");
  }

  const uifs = new ethers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uifs.encodeFunctionData("upgradeTo", [impl]);

  const tlArrayIface = new ethers.Interface([
    "function execute(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt)"
  ]);

  const targets = [governorProxy];
  const values = [0];
  const datas = [upgradeCalldata];
  const predecessor = "0x" + "00".repeat(32);

  const enc = tlArrayIface.encodeFunctionData("execute", [targets, values, datas, predecessor, salt]);

  console.log("Attempting provider.call (simulation) for array-overload execute...");
  try {
    const sim = await ethers.provider.call({ to: timelockAddr, data: enc });
    console.log("Simulation succeeded (provider.call returned):", sim);
  } catch (simErr: any) {
    console.error("Simulation reverted. Raw:", simErr?.data ?? simErr?.error?.data ?? simErr?.message ?? simErr);
    // decode common oz timelock custom error for readability:
    const raw = simErr?.data ?? simErr?.error?.data ?? null;
    if (raw && raw.slice(0,10) === "0x5ead8eb5") {
      console.error("Reverted with TimelockUnexpectedOperationState (operation state mismatch).");
    }
    return;
  }

  console.log("Simulation OK → sending execute tx from", wallet.address);
  const tx = await wallet.sendTransaction({ to: timelockAddr, data: enc });
  console.log("tx submitted:", tx.hash);
  const rcpt = await tx.wait();
  console.log("tx mined:", rcpt.transactionHash, "status:", rcpt.status);
}

main().catch((e)=>{ console.error(e); process.exit(1); });




