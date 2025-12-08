// scripts/debugExtractRevertFromTx.ts
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main() {
  const txHash = process.env.EXECUTE_TX_HASH ?? "0xb8428742ba368a925d1a2854bd987a920eaa93e5eb668818b4d011d6f12d713e";
  console.log("Looking up tx:", txHash);

  const provider = hreEthers.provider;
  const receipt = await provider.getTransactionReceipt(txHash);
  console.log("Receipt:", receipt ? {
    hash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    gasUsed: receipt.gasUsed?.toString(),
    logsLength: receipt.logs?.length
  } : "NOT FOUND");

  // Try debug_traceTransaction (may not be supported by remote RPC)
  try {
    console.log("Attempting debug_traceTransaction (may fail on remote provider)...");
    const trace = await provider.send("debug_traceTransaction", [txHash, {}]);
    console.log("TRACE (debug_traceTransaction) result (first 2000 chars):", JSON.stringify(trace).slice(0, 2000));
  } catch (e) {
    console.warn("debug_traceTransaction not available / failed:", (e as any).message ?? e);
  }

  // Try calling the same data via call (call will return revert data)
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.warn("Transaction not found by provider.getTransaction");
      return;
    }
    console.log("Simulating via provider.call to get revert (this uses latest state)...");
    const callRes = await provider.call({ to: tx.to!, data: tx.data }, tx.blockNumber ?? "latest");
    console.log("provider.call returned:", callRes);
  } catch (err: any) {
    console.error("provider.call threw; attempting to extract revert data from error...");
    const data = err?.data ?? err?.error?.data ?? err?.body ?? null;
    console.log("raw revert data (if any):", data);
  }

  console.log("Done.");
}

main().catch((e) => { console.error("failed:", e?.message ?? e); process.exit(1); });



