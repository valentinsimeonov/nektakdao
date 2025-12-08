



// scripts/debugFindOnchainSelector.ts

import hre from "hardhat";
import fs from "fs";

const addrs = [
  "0x6EEE9840017D4fc58C8c9D657E65fe010D815484", // timelock proxy
  "0x9645e485b04246163684Bff3dcfBF8295917712B", // timelock impl (from .env)
  "0x90382F047bbc21d95736b96e803b53843087AB8a", // governor proxy
  "0x312d61b01d9526f2ae928991fd1c5f5016d8914a", // governor current impl
  "0x442B5944ce9391eDEBD1b2EB55eB075A2FF4cC0c"  // governor new impl
];

async function main() {
  const selector = (process.env.SELECTOR ?? "0x5ead8eb5").replace(/^0x/, "").toLowerCase();
  console.log("Searching for selector 0x" + selector);
  for (const a of addrs) {
    try {
      const code = await hre.ethers.provider.getCode(a);
      const has = code.toLowerCase().includes(selector);
      console.log(a, "code length:", code.length, "contains?", has);
    } catch (e) {
      console.warn("failed to fetch code for", a, e?.message ?? e);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });




// npx hardhat run scripts/debugFindOnchainSelector.ts --network base_sepolia
