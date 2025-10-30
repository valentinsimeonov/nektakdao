// contracts/scripts/deployTokenUpgradeable.ts
import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

const OUT = path.join(__dirname, "..", "deployments");

function ensureOut() { if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true }); }

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying token with:", deployer.address);

  const Token = await ethers.getContractFactory("NektakTokenUpgradeable");
  const tokenProxy = await upgrades.deployProxy(Token, ["Nektak Token", "NKT"], { initializer: "initialize", kind: "uups" });
  await tokenProxy.waitForDeployment();

  const proxyAddr = await tokenProxy.getAddress();
  const implAddr = await upgrades.erc1967.getImplementationAddress(proxyAddr);
  console.log("Token proxy:", proxyAddr);
  console.log("Token impl:", implAddr);

  ensureOut();
  const outPath = path.join(OUT, `${(await ethers.provider.getNetwork()).name}.json`);
  const current = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
  current.Token = { proxy: proxyAddr, implementation: implAddr };
  current.timestamp = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(current, null, 2));
  console.log("Saved", outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });