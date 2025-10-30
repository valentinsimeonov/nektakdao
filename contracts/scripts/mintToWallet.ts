import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const OUT = path.join(__dirname, "..", "deployments");

function read(network: string) {
  const p = path.join(OUT, `${network}.json`);
  if (!fs.existsSync(p)) throw new Error("deploy file missing: " + p);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = (await ethers.provider.getNetwork()).name;
  const data = read(network);
  const tokenAddr = data.Token.proxy ?? data.Token.address ?? data.Token;

  const target = process.argv[2];
  const amountHuman = process.argv[3] || "1000"; // default 1000 NKT
  if (!target) throw new Error("Usage: npx hardhat run scripts/mint-to-wallet.ts --network <net> -- <targetAddress> <amount>");

  const Token = await ethers.getContractAt("NektakTokenUpgradeable", tokenAddr, deployer);
  const decimals = 18;
  const amount = ethers.parseUnits(amountHuman, decimals);

  console.log("Minting", amountHuman, "NKT to", target);
  const tx = await Token.mint(target, amount);
  await tx.wait();
  console.log("Mint tx:", tx.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });