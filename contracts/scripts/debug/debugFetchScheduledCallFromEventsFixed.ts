// scripts/debugFetchScheduledCallFromEventsFixed.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const ethers = (hre as any).ethers;
  const provider = ethers.provider;
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelockAddr) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");

  // Event signatures
  const sigCallScheduled = "CallScheduled(bytes32,uint256,address,uint256,bytes,bytes32,uint256)";
  const sigCallSalt      = "CallSalt(bytes32,bytes32)";
  const topicCallScheduled = ethers.id(sigCallScheduled);
  const topicCallSalt      = ethers.id(sigCallSalt);

  const latest = await provider.getBlockNumber();
  // tune this if provider rejects big ranges; default scan 200k blocks
  const blocksBack = process.env.EVENT_SCAN_BLOCKS ? parseInt(process.env.EVENT_SCAN_BLOCKS) : 200000;
  const from = Math.max(0, latest - blocksBack);
  console.log("Scanning timelock logs from", from, "to", latest, "for CallScheduled...");

  let logs;
  try {
    logs = await provider.getLogs({
      address: timelockAddr,
      fromBlock: from,
      toBlock: latest,
      topics: [topicCallScheduled]
    });
  } catch (e: any) {
    console.error("getLogs error:", e?.message ?? e);
    return;
  }

  console.log("Found", logs.length, "CallScheduled logs (in scanned range).");

  const tlIface = new ethers.Interface([
    "event CallScheduled(bytes32 indexed id, uint256 index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)",
    "event CallSalt(bytes32 indexed id, bytes32 salt)"
  ]);

  for (const l of logs) {
    let parsed: any = null;
    try {
      parsed = tlIface.parseLog(l);
    } catch {
      // some clients return topics/args in different order; fallback parse manually
      console.log("--- raw log (could not parse):", l.transactionHash, "block", l.blockNumber);
      continue;
    }
    const args = parsed.args;
    console.log("---");
    console.log("tx:", l.transactionHash, "block:", l.blockNumber);
    console.log("id:", args.id);
    console.log("index:", args.index?.toString?.());
    console.log("target:", args.target);
    console.log("value:", args.value?.toString?.());
    console.log("predecessor:", args.predecessor);
    console.log("delay:", args.delay?.toString?.());
    console.log("data (hex):", args.data);
    console.log("----");
    console.log("If this is the upgrade you scheduled, use this `data` + the `id` printed above when calling execute().");
  }

  if (logs.length === 0) {
    console.log("No CallScheduled logs found in that range. Increase EVENT_SCAN_BLOCKS or check schedule block.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
