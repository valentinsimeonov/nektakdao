// scripts/debugDecodeRevertSelector.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const ethersAny = (hre as any).ethers;
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");
const rawHexFromEnv = process.env.RAW_REVERT_DATA ?? "";
const txHashFromEnv = process.env.EXECUTE_TX_HASH ?? "";

function first4(hex: string) {
  if (!hex) return "";
  const h = hex.replace(/^0x/, "");
  return "0x" + h.slice(0, 8);
}

function readAllArtifactAbis(dir: string): Array<{ name: string; abi: any; path: string }> {
  const out: Array<{ name: string; abi: any; path: string }> = [];

  function walk(d: string) {
    const entries = fs.readdirSync(d);
    for (const e of entries) {
      const full = path.join(d, e);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else {
        // artifact json files ending with .json (contract artifacts)
        if (e.endsWith(".json")) {
          try {
            const json = JSON.parse(fs.readFileSync(full, "utf8"));
            if (json.abi) {
              const name = json.contractName ?? path.basename(full);
              out.push({ name, abi: json.abi, path: full });
            }
          } catch {
            // ignore invalid
          }
        }
      }
    }
  }

  walk(dir);
  return out;
}

function hexToHuman(hex: string) {
  if (!hex || hex === "0x") return "(empty)";
  return hex;
}

async function main() {
  if (!rawHexFromEnv && !txHashFromEnv) {
    console.error("Usage: set RAW_REVERT_DATA (hex) or EXECUTE_TX_HASH in env and run the script.");
    console.error("You already captured raw revert hex earlier; set RAW_REVERT_DATA to that value.");
    process.exit(1);
  }

  let raw = rawHexFromEnv;
  if (!raw && txHashFromEnv) {
    // try to fetch receipt and trace return value
    try {
      const provider = ethersAny.provider;
      const tx = await provider.getTransaction(txHashFromEnv);
      if (!tx) {
        console.error("Transaction not found:", txHashFromEnv);
      } else {
        try {
          // provider.call will usually throw and include revert data
          await provider.call({ to: tx.to!, data: tx.data }, tx.blockNumber ?? "latest");
          console.log("provider.call did not revert — unexpected");
        } catch (err: any) {
          raw = err?.data ?? err?.error?.data ?? err?.body ?? "";
          if (typeof raw === "object") raw = JSON.stringify(raw);
          if (!raw) {
            console.error("Could not extract revert data from call error for tx", txHashFromEnv);
            process.exit(1);
          }
        }
      }
    } catch (e: any) {
      console.error("Error fetching tx or call:", e?.message ?? e);
      process.exit(1);
    }
  }

  raw = raw.trim();
  if (!raw.startsWith("0x")) raw = "0x" + raw.replace(/^0x/, "");
  console.log("Raw revert hex (first 200 chars):", raw.slice(0, 200));

  const sel = first4(raw);
  console.log("Selector:", sel);

  // Load ABIs from artifacts
  const abis = readAllArtifactAbis(ARTIFACTS_DIR);
  console.log("Found", abis.length, "artifact ABIs to scan.");

  let matches: Array<{
    artifact: string;
    frag: any;
    kind: string;
    decoded?: any;
  }> = [];

  for (const a of abis) {
    try {
      const iface = new ethersAny.Interface(a.abi);
      // iterate fragments (errors + functions)
      for (const frag of iface.fragments) {
        // only errors and functions can be used as revert signatures (custom errors use selector of keccak256(errorSignature))
        if (frag.type === "error" || frag.type === "function") {
          const sig = iface.getSighash(frag);
          if (sig === sel) {
            // try to decode raw against frag
            try {
              // for revert custom error, calldata layout = selector + encoded args
              const payloadHex = raw.replace(/^0x/, "").slice(8); // after selector
              const payload = "0x" + payloadHex;
              let decoded = null;
              if (frag.type === "error") {
                decoded = iface.decodeErrorResult(frag.name, payload);
              } else {
                // if it's a function, decode as function result (rare)
                decoded = iface.decodeFunctionResult(frag.name, payload);
              }
              matches.push({ artifact: a.path, frag: frag.format(), kind: frag.type, decoded });
            } catch (de) {
              matches.push({ artifact: a.path, frag: frag.format(), kind: frag.type, decoded: "(could not decode args)" });
            }
          }
        }
      }
    } catch (e) {
      // ignore artifacts we can't parse
    }
  }

  if (matches.length === 0) {
    console.log("No matches found in local ABIs.");
    console.log("Selector might be from a library/contract you did not compile locally, or it is an encoded Error(string).");
    console.log("If you want, paste the selector here and I can try to identify likely built-in OZ errors.");
    process.exit(0);
  }

  console.log("Matches found:", matches.length);
  for (const m of matches) {
    console.log("----");
    console.log("Artifact:", m.artifact);
    console.log("Fragment:", m.frag);
    console.log("Kind:", m.kind);
    console.log("Decoded args:", m.decoded);
  }

  console.log("Done.");
}

main().catch((e) => { console.error("failed:", e?.message ?? e); process.exit(1); });



