// scripts/debugTraceCallTracer.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const ethers = (hre as any).ethers;
  const txHash = process.env.DEBUG_TX_HASH;
  if (!txHash) throw new Error("Set DEBUG_TX_HASH in .env to the failing tx hash (e.g. 0xb842...)");

  console.log("Looking up receipt for:", txHash);
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error("Receipt not found for tx " + txHash);

  console.log("Attempting debug_traceTransaction with callTracer (may fail on some providers)...");
  try {
    // Parity-style call tracer gives a nice nested call tree with error info
    const res = await ethers.provider.send("debug_traceTransaction", [
      txHash,
      { tracer: "callTracer", timeout: "120s" }
    ]);
    console.log("trace (callTracer):");
    console.log(JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error("callTracer failed:", err?.message ?? err);
    console.log("Falling back to raw debug_traceTransaction (structLogs)...");
    try {
      const res2 = await ethers.provider.send("debug_traceTransaction", [txHash, {}]);
      console.log("raw trace saved (first 2000 chars):");
      console.log(JSON.stringify(res2).slice(0, 2000));
      console.log("Full raw trace saved to trace_raw.json");
      require("fs").writeFileSync("trace_raw.json", JSON.stringify(res2, null, 2));
    } catch (err2: any) {
      console.error("debug_traceTransaction fallback failed:", err2?.message ?? err2);
    }
  }
}

main().catch((e) => { console.error("failed:", e?.message ?? e); process.exit(1); });





