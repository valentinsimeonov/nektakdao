// scripts/debugListTimelockRolesFixed.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

function bytes32ToHex(b: string) {
  return b.startsWith("0x") ? b : "0x" + b;
}

async function main() {
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelock) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");

  console.log("Timelock proxy:", timelock);

  // selectors for role constants
  const selDefault = hreEthers.id("DEFAULT_ADMIN_ROLE()").slice(0,10);
  const selProposer = hreEthers.id("PROPOSER_ROLE()").slice(0,10);
  const selExecutor = hreEthers.id("EXECUTOR_ROLE()").slice(0,10);

  // provider.call raw to fetch those constants (works even if Contract runner misbehaves)
  const provider = hreEthers.provider;

  try {
    const rawAdmin = await provider.call({ to: timelock, data: selDefault });
    const rawProp  = await provider.call({ to: timelock, data: selProposer });
    const rawExec  = await provider.call({ to: timelock, data: selExecutor });

    console.log("DEFAULT_ADMIN_ROLE:", rawAdmin === "0x" ? "(empty)" : rawAdmin);
    console.log("PROPOSER_ROLE:     ", rawProp  === "0x" ? "(empty)" : rawProp);
    console.log("EXECUTOR_ROLE:     ", rawExec  === "0x" ? "(empty)" : rawExec);

  } catch (e) {
    console.warn("Could not read role constants via call():", (e as any).message ?? e);
  }

  // Now scan RoleGranted / RoleRevoked events to find current members (fallback)
  const roleGrantedTopic = hreEthers.id("RoleGranted(bytes32,address,address)");
  const roleRevokedTopic = hreEthers.id("RoleRevoked(bytes32,address,address)");

  // fetch logs for a reasonable window (you can increase range if you need historical)
  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - 200000); // scan last 200k blocks (adjust if needed)
  console.log(`Scanning RoleGranted/RoleRevoked logs from block ${fromBlock} to ${latest} (may take a few seconds)...`);

  const logs = await provider.getLogs({
    address: timelock,
    fromBlock,
    toBlock: latest,
    topics: [ [roleGrantedTopic, roleRevokedTopic] ] // filter both topics
  });

  // Map role => Set(accounts)
  const roleMembers: Record<string, Set<string>> = {};

  for (const l of logs) {
    const topic0 = l.topics[0];
    // decode topics: topics[1] = role (bytes32) ; topics[2] = account
    const role = l.topics[1];
    const account = "0x" + l.topics[2].slice(26); // last 20 bytes of topic
    const isGrant = topic0.toLowerCase() === roleGrantedTopic.toLowerCase();

    roleMembers[role] = roleMembers[role] || new Set();

    if (isGrant) {
      roleMembers[role].add(account.toLowerCase());
    } else {
      // RoleRevoked: remove if present
      roleMembers[role].delete(account.toLowerCase());
    }
  }

  // Print discovered role members (limited to those seen in logs)
  if (Object.keys(roleMembers).length === 0) {
    console.log("No RoleGranted/RoleRevoked logs found in the scanned window.");
  } else {
    console.log("Discovered role members (from events):");
    for (const [role, set] of Object.entries(roleMembers)) {
      console.log(" role:", role);
      if (set.size === 0) {
        console.log("   (no members currently recorded in scanned logs)");
      } else {
        for (const a of set) console.log("   ", a);
      }
    }
  }

  // Helpful hint: zero-address executor (0x000...000) means "open execution" (anyone can execute)
  console.log("Note: if EXECUTOR_ROLE member includes 0x000... then execution is open to anyone.");
}

main().catch((e)=>{ console.error("failed:", e?.message ?? e); process.exit(1); });






