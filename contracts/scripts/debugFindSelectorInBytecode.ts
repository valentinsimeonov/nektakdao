// scripts/debugFindSelectorInBytecode.ts

import hre from "hardhat";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const ethers = (hre as any).ethers;
async function main() {
  const selectors = [
    "0x5ead8eb5", // selector from your failed tx
    "0xd6bda275", // FailedCall timelock wrapper (observed earlier)
  ];
  const addresses = [
    process.env.TIMELOCK_PROXY_ADDRESS,
    process.env.GOVERNOR_PROXY_ADDRESS,
    process.env.GOVERNOR_IMPL_ADDRESS,
    process.env.LAST_IMPL_ADDRESS
  ].filter(Boolean) as string[];

  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Selectors to search:", selectors.join(", "));
  console.log("Addresses to fetch code:", addresses.join(", "));

  for (const addr of addresses) {
    const code = await ethers.provider.getCode(addr);
    console.log("\n---", addr, "--- code length:", code.length);
    for (const sel of selectors) {
      const found = code.includes(sel.replace(/^0x/, ""));
      console.log(` contains ${sel}? -> ${found}`);
      if (found) {
        // show a snippet around first occurrence
        const idx = code.indexOf(sel.replace(/^0x/, ""));
        const before = code.slice(Math.max(0, idx - 80), idx);
        const after = code.slice(idx, Math.min(code.length, idx + 160));
        console.log(" snippet (hex): ...", before, after, "...");
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });




