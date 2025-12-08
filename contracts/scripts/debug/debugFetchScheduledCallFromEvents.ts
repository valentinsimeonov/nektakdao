


// scripts/debugFetchScheduledCallFromEvents.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const ethers = (hre as any).ethers;
  const provider = ethers.provider;
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelockAddr) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");

  // event fragment for CallScheduled(address,uint256,bytes,bytes32,uint256) is emitted as CallScheduled in OZ timelock
  const tlIface = new ethers.Interface([
    "event CallScheduled(bytes32 indexed id, uint256 index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)",
    "event CallSalt(bytes32 indexed id, bytes32 salt)"
  ]);

  const blocksBack = process.env.EVENT_SCAN_BLOCKS ? parseInt(process.env.EVENT_SCAN_BLOCKS) : 200000; // tune if provider rejects range
  const latest = await provider.getBlockNumber();
  const from = Math.max(0, latest - blocksBack);
  console.log("Scanning timelock logs from", from, "to", latest, "for CallScheduled and CallSalt...");

  const callScheduledTopic = tlIface.getEventTopic("CallScheduled");
  const callSaltTopic = tlIface.getEventTopic("CallSalt");

  // fetch logs - note public providers can have range limits; adjust blocksBack if you get an error
  const logs = await provider.getLogs({
    address: timelockAddr,
    fromBlock: from,
    toBlock: latest,
    topics: [callScheduledTopic]
  }).catch((e: any) => { console.error("getLogs error:", e?.message ?? e); return []; });

  console.log("Found", logs.length, "CallScheduled logs (in scanned range).");

  const parsed = logs.map((l: any) => {
    try {
      const decoded = tlIface.parseLog(l);
      return {
        txHash: l.transactionHash,
        blockNumber: l.blockNumber,
        id: decoded.args.id,
        index: decoded.args.index?.toString?.() ?? decoded.args[1]?.toString(),
        target: decoded.args.target,
        value: decoded.args.value?.toString?.(),
        data: decoded.args.data,
        predecessor: decoded.args.predecessor,
        delay: decoded.args.delay?.toString?.(),
      };
    } catch (e) {
      return { rawLog: l };
    }
  });

  for (const p of parsed) {
    console.log("---");
    console.log("tx:", p.txHash, "block:", p.blockNumber);
    console.log("id:", p.id);
    console.log("index:", p.index);
    console.log("target:", p.target);
    console.log("value:", p.value);
    console.log("predecessor:", p.predecessor);
    console.log("delay:", p.delay);
    console.log("data (hex):", p.data);
    console.log("You can pass this `data` into execute(...) and the `id` is the scheduled operation id.");
  }

  if (parsed.length === 0) {
    console.log("No CallScheduled logged in that range. Try increasing EVENT_SCAN_BLOCKS or ensure the op was scheduled in a different block range.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
