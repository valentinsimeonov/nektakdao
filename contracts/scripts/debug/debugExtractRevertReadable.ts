// scripts/debugExtractRevertReadable.ts
import hre from "hardhat";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const provider = (hre as any).ethers.provider;

function decodeErrorString(rawHex: string) {
  if (!rawHex || rawHex === "0x") return null;
  const h = rawHex.replace(/^0x/, "");
  if (h.startsWith("08c379a0")) {
    // Error(string)
    const lenHex = h.slice(8 + 64, 8 + 64 + 64);
    const len = parseInt(lenHex, 16) * 2;
    const strHex = h.slice(8 + 64 + 64, 8 + 64 + 64 + len);
    return Buffer.from(strHex, "hex").toString("utf8");
  }
  return null;
}

async function main() {
  const txHash = process.env.TX_HASH;
  if (!txHash) throw new Error("Set TX_HASH in .env to the failing tx hash.");

  console.log("Looking up tx:", txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error("Receipt not found");
  console.log("Receipt status:", receipt.status);
  console.log("Attempting debug_traceTransaction (may fail on remote providers)...");
  try {
    const trace = await provider.send("debug_traceTransaction", [txHash, {}]);
    const rv = trace?.returnValue ?? trace?.result?.returnValue ?? null;
    let raw = rv;
    if (!raw && trace && typeof trace === "object" && trace.structLogs) {
      // older provider shapes put returnValue near top-level
      raw = trace.returnValue ?? null;
    }
    if (!raw) {
      // Sometimes the RPC response includes the revert in `trace`'s top-level field:
      raw = trace;
    }
    console.log("Raw trace returnValue (first 300 chars):", String(raw).slice(0, 300));
    const candidate = String(raw).match(/0x[0-9a-fA-F]+/);
    const hex = candidate ? candidate[0] : raw;
    if (!hex) {
      console.log("No hex revert data found in trace.");
      return;
    }
    console.log("raw revert hex:", hex);
    const errString = decodeErrorString(hex);
    if (errString) {
      console.log("Decoded Error(string):", errString);
      return;
    }
    // print selector + data
    const selector = hex.slice(0, 10);
    const args = "0x" + hex.replace(/^0x/, "").slice(8);
    console.log("Selector:", selector);
    console.log("Hex args (rest):", args);
    // try 4byte.directory lookup
    try {
      const q = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`;
      console.log("Querying 4byte.directory:", q);
      const resp = await fetch(q);
      const json = await resp.json();
      if (json && Array.isArray(json.results) && json.results.length) {
        console.log("4byte matches (first result):", json.results[0]);
      } else {
        console.log("No match in 4byte DB for this selector.");
      }
    } catch (err) {
      console.log("4byte lookup failed (maybe no internet from this environment):", (err as any).message ?? err);
    }
  } catch (err: any) {
    console.log("debug_traceTransaction failed; attempting provider.call simulation to extract revert...");
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) throw new Error("Transaction not found");
      const callRes = await provider.call({ to: tx.to, data: tx.data, from: tx.from });
      console.log("provider.call returned (no revert):", callRes);
    } catch (callErr: any) {
      console.log("callErr.data (raw revert):", callErr?.data ?? callErr?.error?.data ?? callErr?.body ?? callErr?.message);
      const raw = callErr?.data ?? callErr?.error?.data ?? null;
      if (raw) {
        const errString = decodeErrorString(raw);
        if (errString) {
          console.log("Decoded Error(string):", errString);
        } else {
          console.log("Raw revert hex:", raw);
        }
      }
    }
  }
}

main().catch((e) => {
  console.error("extract failed:", e?.message ?? e);
  process.exit(1);
});