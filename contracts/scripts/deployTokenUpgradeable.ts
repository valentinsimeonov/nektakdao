// contracts/scripts/deployTokenUpgradeable.ts
import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const OUT = path.join(__dirname, "..", "deployments");
function ensureOut() { if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true }); }

async function save(networkName: string, deployer: string, updates: any) {
  ensureOut();
  const outPath = path.join(OUT, `${networkName}.json`);
  const current = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
  const merged = { ...current, ...updates, timestamp: new Date().toISOString(), deployer };
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log("Saved", outPath);
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in env");

  // Use Wallet to sign locally (prevents eth_sendTransaction RPC usage)
  const deployer = new ethers.Wallet(pk, ethers.provider);
  const networkObj = await ethers.provider.getNetwork();
  const networkName = networkObj.name || String(networkObj.chainId);
  console.log("Deploying token on", networkName, "from", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Token constructor args / initializer args
  const TOKEN_NAME = process.env.TOKEN_NAME || "Nektak Token";
  const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || "NKT";

  // 1) Deploy implementation
  console.log("Deploying token implementation...");
  const TokenFactory = await ethers.getContractFactory("NektakTokenUpgradeable", deployer);
  const impl = await TokenFactory.deploy();
  await impl.waitForDeployment();
  const implAddr = await impl.getAddress();
  console.log(" Token implementation:", implAddr);

  // 2) Prepare initializer calldata
  const initCalldata = TokenFactory.interface.encodeFunctionData("initialize", [TOKEN_NAME, TOKEN_SYMBOL]);

  // 3) Deploy ERC1967ProxyWrapper (make sure you have ERC1967ProxyWrapper.sol in contracts/)
  console.log("Deploying ERC1967ProxyWrapper with initializer...");
  const ProxyFactory = await ethers.getContractFactory("ERC1967ProxyWrapper", deployer);
  // Try constructor delegatecall with initCalldata first (common case)
  let proxy;
  try {
    proxy = await ProxyFactory.deploy(implAddr, initCalldata);
    await proxy.waitForDeployment();
  } catch (err) {
    console.warn("Proxy construction with initializer failed, trying deploy without init then manual initialize:", (err as any).message ?? err);
    // fallback: deploy without init, then manual initialize
    proxy = await ProxyFactory.deploy(implAddr, "0x");
    await proxy.waitForDeployment();
    const proxyAddressFallback = await proxy.getAddress();
    // attach token ABI to proxy and call initialize manually
    const tokenAtProxyFallback = TokenFactory.attach(proxyAddressFallback).connect(deployer) as any;
    const called = await tokenAtProxyFallback.initialize(TOKEN_NAME, TOKEN_SYMBOL).catch((e: any) => {
      console.error("Manual initialize reverted:", e?.message ?? e);
      throw e;
    });
    console.log("Manual initialize tx:", (called as any)?.hash ?? "unknown");
  }

  const proxyAddr = await proxy.getAddress();
  console.log(" Token proxy:", proxyAddr);

  // 4) Verify by reading name & symbol (low-level acceptance)
  try {
    const tokenAtProxy = TokenFactory.attach(proxyAddr) as any;
    const name = await tokenAtProxy.name();
    const symbol = await tokenAtProxy.symbol();
    console.log(" Verified name/symbol:", String(name), "/", String(symbol));
  } catch (err) {
    console.warn("Failed to read name/symbol from proxy (proxy might not be initialized yet). Attempting manual initialize...");
    try {
      const tokenAtProxy = TokenFactory.attach(proxyAddr).connect(deployer) as any;
      await tokenAtProxy.initialize(TOKEN_NAME, TOKEN_SYMBOL);
      console.log("Manual initialize successful");
    } catch (e) {
      console.error("Manual initialize also failed:", (e as any).message ?? e);
      throw e;
    }
  }

  // 5) Optionally get implementation address from ERC1967 slot (helper)
  // Note: upgrades.erc1967.getImplementationAddress requires upgrades plugin; we can compute/read slot directly
  // But since we have implAddr from earlier, use it.
  console.log(" Implementation (used):", implAddr);

  // 6) Save addresses
  await save(networkName, deployer.address, { Token: { proxy: proxyAddr, implementation: implAddr } });

  console.log("Done.");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});