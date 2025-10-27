// contracts/scripts/deployBox.ts
import fs from "fs";
import path from "path";
import hre from "hardhat";
import dotenv from "dotenv";
dotenv.config();

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

function ensureOutputDir() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    console.warn("[deployBox] Warning: could not create deployments dir, will fallback");
  }
}
ensureOutputDir();

async function waitForConfirmation(tx: any, confirmations = 1) {
  await tx.wait(confirmations);
  // tiny delay so provider + mempool sync
  await new Promise((r) => setTimeout(r, 1500));
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("[deployBox] deploying with", deployer.address);

  const balBn = await deployer.getBalance();
  console.log("[deployBox] deployer ETH balance:", hre.ethers.utils.formatEther(balBn));

  // compile just in case
  await hre.run("compile");

  const BoxFactory = await hre.ethers.getContractFactory("Box");
  // Use pending nonce for safety
  const nonce = await deployer.getTransactionCount("pending");
  console.log("[deployBox] using nonce:", nonce);

  const gasSettings = {
    // optional — you can customize or call getFeeData as in your main deploy
  };

  const box = await BoxFactory.deploy({
    nonce,
    ...gasSettings,
  });

  console.log("[deployBox] tx:", box.deployTransaction.hash);
  await waitForConfirmation(box.deployTransaction, 1);
  console.log("[deployBox] Box deployed at:", box.address);

  // Save deployments file (append)
  const network = hre.network.name;
  const outPath = path.join(OUTPUT_DIR, `${network}.json`);
  let data: any = {
    network,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {},
  };

  try {
    if (fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      data = { ...existing };
      data.timestamp = new Date().toISOString();
      data.contracts = { ...(existing.contracts ?? {}) };
    }
  } catch (err) {
    console.warn("[deployBox] could not read existing deployment file:", err);
  }

  data.contracts = data.contracts ?? {};
  data.contracts.Box = { address: box.address };

  try {
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log("[deployBox] Saved deployment to:", outPath);
  } catch (err: any) {
    console.warn("[deployBox] Could not write deployments file (permission?), printing to stdout instead");
    console.log(JSON.stringify(data, null, 2));
  }

  console.log("[deployBox] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});