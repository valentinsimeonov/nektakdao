
// scripts/debugDumpDebugTrace.ts

import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const ethers = (hre as any).ethers;

async function main() {
  const txHash = process.env.DEBUG_TX_HASH; // set to your failed tx hash (the one you ran with callExecuteNow)
  if (!txHash) throw new Error("Set DEBUG_TX_HASH in .env to the failed tx hash");

  console.log("Fetching receipt for:", txHash);
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  console.log("Receipt status:", receipt?.status, "block:", receipt?.blockNumber);
  console.log("Attempting debug_traceTransaction (may fail on public providers)...");
  try {
    const trace = await ethers.provider.send("debug_traceTransaction", [txHash, {}]);
    // print top-level returnValue and a compact list of CALLs with their to/from and depth
    console.log("TRACE returnValue (first 300 chars):", trace?.returnValue?.slice(0,300));
    if (Array.isArray(trace.structLogs)) {
      console.log("structLogs length:", trace.structLogs.length);
    }
    // scan structLogs for REVERT op and the stack at that moment
    for (let i = 0; i < trace.structLogs.length; i++) {
      const s = trace.structLogs[i];
      if (s.op === "REVERT" || s.op === "INVALID" || s.op === "RETURN") {
        console.log("op at pc:", s.pc, "depth:", s.depth, "op:", s.op);
        // print some nearby ops
        const start = Math.max(0, i - 8);
        const end = Math.min(trace.structLogs.length, i + 6);
        console.log("Nearby ops:");
        for (let j = start; j < end; j++) {
          const t = trace.structLogs[j];
          console.log(j, t.depth, t.op, "pc", t.pc);
        }
        break;
      }
    }
    // Try to locate 'CALL' or 'DELEGATECALL' that returns false before revert
    console.log("\nFinding last CALL/DELEGATECALL before revert:");
    for (let i = trace.structLogs.length - 1; i >= 0; i--) {
      const s = trace.structLogs[i];
      if (s.op && (s.op.includes("CALL") || s.op === "STATICCALL" || s.op === "DELEGATECALL")) {
        console.log(" at index", i, "op", s.op, "pc", s.pc, "depth", s.depth);
        break;
      }
    }
    console.log("\nFull trace object saved to ./trace.json");
    require("fs").writeFileSync("./trace.json", JSON.stringify(trace, null, 2));
    console.log("Saved. Inspect trace.json or paste it here if you want me to analyze.");
  } catch (err) {
    console.error("debug_traceTransaction failed:", err?.message ?? err);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });




