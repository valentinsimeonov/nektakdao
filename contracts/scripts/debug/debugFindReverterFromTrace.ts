


// scripts/debugFindReverterFromTrace.ts

import fs from "fs";
import path from "path";

function main() {
  const tracePath = path.join(process.cwd(), "trace.json");
  if (!fs.existsSync(tracePath)) throw new Error("trace.json not found in project root (run dumpDebugTrace.ts first)");
  const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  // The trace object usually has calls array under .calls or we must inspect structLogs: we'll look for RETURN/REVERT and nearest CALL
  // Some providers return a top-level 'calls' structure; others only structLogs. We'll try both.
  console.log("Trace keys:", Object.keys(trace));
  // 1) try to find top-level calls (if present)
  if (trace.calls) {
    console.log("trace.calls present — searching for deepest reverted call...");
    function walk(call, pathStack=[]) {
      if (!call) return null;
      if (call.error) {
        return { call, path: pathStack.concat(call) };
      }
      if (call.calls && call.calls.length) {
        for (const c of call.calls) {
          const found = walk(c, pathStack.concat(call));
          if (found) return found;
        }
      }
      return null;
    }
    const found = walk(trace.calls);
    console.log("found (calls structure):", found ? found.call.to : "none");
    if (found) {
      console.log("Reverting call object:", JSON.stringify(found.call, null, 2));
      return;
    }
  }

  // 2) fallback: use structLogs; find the REVERT op and backtrack to last CALL/DELEGATECALL to get destination address from stack if possible
  const logs = trace.structLogs;
  if (!logs) { console.log("No structLogs in trace.json — cannot inspect further."); return; }
  // find index of first REVERT from the end
  let revIdx = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].op === "REVERT") { revIdx = i; break; }
  }
  console.log("REVERT at structLogs index:", revIdx);
  if (revIdx === -1) return console.log("No REVERT op found in structLogs");

  // find the most recent CALL/DELEGATECALL/STATICCALL/ CALLCODE around there
  for (let i = revIdx; i >= 0; i--) {
    const op = logs[i].op;
    if (op && (op.includes("CALL") || op === "DELEGATECALL" || op === "STATICCALL")) {
      console.log("Last relevant external call op before REVERT:", op, "at index", i);
      // show some context
      const start = Math.max(0, i - 8);
      const end = Math.min(logs.length, i + 4);
      console.log("Nearby ops (index, depth, op):");
      for (let j = start; j < end; j++) {
        console.log(j, logs[j].depth, logs[j].op);
      }
      console.log("Full logs snippet saved to reverter_snippet.json");
      fs.writeFileSync("reverter_snippet.json", JSON.stringify(logs.slice(Math.max(0, i - 40), Math.min(logs.length, i + 40)), null, 2));
      return;
    }
  }
  console.log("No CALL-like op found before REVERT in structLogs");
}

main();







// npx hardhat run scripts/debugFindReverterFromTrace.ts --network base_sepolia