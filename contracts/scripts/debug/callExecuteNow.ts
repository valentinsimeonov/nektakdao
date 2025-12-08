// scripts/callExecuteNow.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
const hreEthers = (hre as any).ethers;

async function main() {
  const pk = process.env.EXECUTOR_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Set EXECUTOR_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY in .env (an EOA with funds to pay gas).");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const timelock = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelock) throw new Error("Set TIMELOCK_PROXY_ADDRESS in .env");

  // Replace these with the exact values you already have (or set in .env)
  const target = process.env.EXECUTE_TARGET ?? process.env.GOVERNOR_PROXY_ADDRESS;
  const value = Number(process.env.EXECUTE_VALUE ?? 0);
  const data = process.env.EXECUTE_DATA ?? "0x3659cfe6000000000000000000000000442b5944ce9391edebd1b2eb55eb075a2ff4cc0c00000000000000000000000000000000000000000000000000000000";
  const predecessor = process.env.EXECUTE_PREDECESSOR ?? "0x" + "00".repeat(32);
  const salt = process.env.EXECUTE_SALT ?? process.env.LAST_UPGRADE_SALT;

  if (!target || !salt) throw new Error("Set EXECUTE_TARGET and EXECUTE_SALT (or LAST_UPGRADE_SALT) in .env");

  const iface = new hreEthers.Interface([
    "function execute(address,uint256,bytes,bytes32,bytes32)"
  ]);
  const callData = iface.encodeFunctionData("execute", [target, value, data, predecessor, salt]);

  console.log("Sending execute(...) from", wallet.address, "to timelock", timelock);
  try {
    const tx = await wallet.sendTransaction({ to: timelock, data: callData, gasLimit: 200000 });
    console.log("tx submitted:", tx.hash);
    const rcpt = await tx.wait();
    console.log("tx mined:", rcpt.transactionHash, "status:", rcpt.status);
    if (rcpt.status === 1) {
      console.log("Execute succeeded.");
    } else {
      console.log("Execute reverted in tx. Status !== 1; check explorer for revert logs.");
    }
  } catch (err: any) {
    // Try to extract revert data
    console.error("execute() call failed (threw). Attempting to extract revert bytes...");
    const dataErr = err?.data ?? err?.error?.data ?? err?.body ?? null;
    if (typeof dataErr === "string") {
      console.log("raw revert hex:", dataErr);
      // try Error(string)
      if (dataErr.startsWith("0x08c379a0")) {
        const lenHex = dataErr.slice(10 + 64, 10 + 64 + 64);
        const len = parseInt(lenHex, 16) * 2;
        const strHex = dataErr.slice(10 + 64 + 64, 10 + 64 + 64 + len);
        console.log("Decoded revert string:", Buffer.from(strHex, "hex").toString("utf8"));
      } else {
        console.log("Revert selector (first 4 bytes):", dataErr.slice(0, 10));
        console.log("Full revert hex:", dataErr);
      }
    } else {
      console.error("Could not extract revert data; full error:", err);
    }
  }
}

main().catch((e)=>{ console.error("failed:", e?.message ?? e); process.exit(1); });




