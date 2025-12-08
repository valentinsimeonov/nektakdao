// scripts/findExecutorMembers.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();
const provider = (hre as any).ethers.provider;

async function main() {
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelock) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");

  // RoleGranted signature
  const roleGrantedTopic = hre.ethers.id("RoleGranted(bytes32,address,address)");
  // EXECUTOR_ROLE value
  const EXEC_ROLE = "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";

  const latest = await provider.getBlockNumber();
  const start = Math.max(0, latest - 500000); // scan recent half-million blocks (adjust as needed)
  const chunk = 50000;
  console.log("Scanning", start, "->", latest, "in chunks of", chunk, "for RoleGranted(EXECUTOR_ROLE,...)");

  for (let from = start; from <= latest; from += chunk) {
    const to = Math.min(latest, from + chunk - 1);
    try {
      const topics = [roleGrantedTopic, EXEC_ROLE];
      const logs = await provider.getLogs({ address: timelock, fromBlock: from, toBlock: to, topics });
      if (logs.length) {
        for (const l of logs) {
          // topics: [RoleGrantedSig, role, account, sender]
          const account = "0x" + l.topics[2].slice(26);
          const sender = "0x" + l.topics[3].slice(26);
          console.log(`RoleGranted(EXECUTOR_ROLE) -> account: ${account} (grantedBy: ${sender}) block:${l.blockNumber} tx:${l.transactionHash}`);
        }
      }
    } catch (e: any) {
      console.warn("chunk failed", from, "->", Math.min(latest, from + chunk - 1), e?.message ?? e);
    }
  }
}

main().catch((e) => { console.error("failed:", e?.message ?? e); process.exit(1); });




