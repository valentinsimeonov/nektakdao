// scripts/debugListTimelockRoles.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main() {
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelock) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");
  const provider = hreEthers.provider;
  const signer = provider.getSigner(0);
  const tl = await hreEthers.getContractAt("TimelockControllerUpgradeable", timelock, signer) as any;

  const DEFAULT_ADMIN = await tl.DEFAULT_ADMIN_ROLE();
  const PROPOSER = await tl.PROPOSER_ROLE();
  const EXECUTOR = await tl.EXECUTOR_ROLE();
  console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN);
  console.log("PROPOSER_ROLE:", PROPOSER);
  console.log("EXECUTOR_ROLE:", EXECUTOR);

  // helper: try to read member count() and members
  const tryList = async (role: string, name: string) => {
    try {
      // OpenZeppelin's TimelockController doesn't expose getRoleMemberCount in older ABI, guard with try/catch
      const count = (await tl.getRoleMemberCount(role)).toNumber?.() ?? Number(await tl.getRoleMemberCount(role));
      console.log(`${name} member count:`, count);
      for (let i = 0; i < count; i++) {
        const m = await tl.getRoleMember(role, i);
        console.log(`  ${name} member[${i}]:`, m);
      }
    } catch (e) {
      console.log(`  (could not enumerate ${name} members via ABI)`);
    }
  };

  await tryList(DEFAULT_ADMIN, "DEFAULT_ADMIN_ROLE");
  await tryList(PROPOSER, "PROPOSER_ROLE");
  await tryList(EXECUTOR, "EXECUTOR_ROLE");
}

main().catch((e)=>{ console.error(e); process.exit(1); });





