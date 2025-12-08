


// scripts/debugSimulateProxiableCall.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const ethers = (hre as any).ethers;
async function main() {
  const newImpl = process.env.LAST_IMPL_ADDRESS;
  const proxy = process.env.GOVERNOR_PROXY_ADDRESS;
  if (!newImpl || !proxy) throw new Error("set LAST_IMPL_ADDRESS and GOVERNOR_PROXY_ADDRESS in .env");
  const selector = ethers.id("proxiableUUID()").slice(0,10);
  console.log("Calling proxiableUUID() on new implementation:", newImpl, "with from:", proxy);
  try {
    const res = await ethers.provider.call({ to: newImpl, data: selector, from: proxy });
    console.log("call returned:", res);
  } catch (err: any) {
    console.error("call reverted. raw:", err?.data ?? err?.error?.data ?? err?.message ?? err);
  }
}
main().catch(e=>{ console.error(e); process.exit(1); });



// npx hardhat run scripts/debugSimulateProxiableCall.ts --network base_sepolia




