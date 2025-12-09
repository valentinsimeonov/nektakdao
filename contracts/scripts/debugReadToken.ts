


//debugReadToken

import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import path from "path";

async function main() {
  const networkObj = await ethers.provider.getNetwork();
  const networkName = networkObj.name || String(networkObj.chainId);
  const deployFile = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  if (!fs.existsSync(deployFile)) {
    console.error("deployments file not found:", deployFile);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(deployFile, "utf8"));
  const proxyAddr = data.Token?.proxy ?? data.Token?.address;
  if (!proxyAddr) {
    console.error("Token proxy address not found in deployments file:", deployFile);
    process.exit(1);
  }
  console.log("Using token proxy at:", proxyAddr);

  const Token = await hre.ethers.getContractFactory("NektakTokenUpgradeable");
  const token = Token.attach(proxyAddr);

  try {
    const name = await token.name();
    console.log("name() via signer:", JSON.stringify(String(name)));
  } catch (e) {
    console.warn("name() via signer failed:", (e as any).message ?? e);
  }
  try {
    const symbol = await token.symbol();
    console.log("symbol() via signer:", JSON.stringify(String(symbol)));
  } catch (e) {
    console.warn("symbol() via signer failed:", (e as any).message ?? e);
  }
  try {
    const owner = await token.owner();
    console.log("owner() via signer:", owner);
  } catch (e) {
    console.warn("owner() via signer failed:", (e as any).message ?? e);
  }

  // low-level probe
  const iface = Token.interface;
  const nameCalldata = iface.encodeFunctionData("name", []);
  const symbolCalldata = iface.encodeFunctionData("symbol", []);
  const nameRaw = await ethers.provider.call({ to: proxyAddr, data: nameCalldata });
  const symRaw = await ethers.provider.call({ to: proxyAddr, data: symbolCalldata });
  console.log("raw name hex:", nameRaw);
  console.log("raw symbol hex:", symRaw);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
