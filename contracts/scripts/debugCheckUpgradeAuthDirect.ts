// scripts/debugCheckUpgradeAuthDirect.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in .env");
  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);

  const governor = process.env.GOVERNOR_PROXY_ADDRESS;
  if (!governor) throw new Error("Set GOVERNOR_PROXY_ADDRESS in .env");

  const iface = new hreEthers.Interface(["function upgradeTo(address)"]);
  // try current implementation read from slot (so we upgrade to same address)
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const raw = await hreEthers.provider.send("eth_getStorageAt", [governor, implSlot, "latest"]);
  const currentImpl = "0x" + raw.replace(/^0x/, "").slice(24);
  const calldata = iface.encodeFunctionData("upgradeTo", [currentImpl]);

  try {
    console.log("Calling governorProxy.upgradeTo(currentImpl) from deployer (should revert if authorization enforced) ...");
    const res = await hreEthers.provider.call({ to: governor, data: calldata, from: wallet.address });
    console.log("provider.call returned (no revert):", res);
  } catch (err: any) {
    console.error("provider.call reverted. raw:", err?.data ?? err?.error?.data ?? err?.body ?? err?.message);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });