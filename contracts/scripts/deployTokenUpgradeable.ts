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
  let proxy = await ProxyFactory.deploy(implAddr, initCalldata);
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  console.log(" Token proxy:", proxyAddr);

  // --- Verify proxy wiring (EIP-1967 implementation slot) and probe initialization ---
  const IMPLEMENTATION_SLOT =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

  function addressToStorageValue(address: string) {
    return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  }

  // read impl slot directly
  let implSlotRaw = "(unavailable)";
  try {
    implSlotRaw = await ethers.provider.send("eth_getStorageAt", [proxyAddr, IMPLEMENTATION_SLOT, "latest"]);
  } catch (e) {
    console.warn("Could not read storage slot via eth_getStorageAt:", (e as any).message ?? e);
  }
  console.log("DEBUG: impl slot raw:", implSlotRaw);
  console.log("DEBUG: expected impl slot:", addressToStorageValue(implAddr));
  if (implSlotRaw !== addressToStorageValue(implAddr)) {
    console.warn("WARNING: proxy implementation slot does not match expected implementation address.");
    console.warn("This usually means the proxy wasn't initialized or constructor delegatecall failed.");
  }

  // Attempt low-level probe for name() and symbol() via provider.call (does NOT send tx)
  const nameCalldata = TokenFactory.interface.encodeFunctionData("name", []);
  const symbolCalldata = TokenFactory.interface.encodeFunctionData("symbol", []);

  let probedName: string | null = null;
  let probedSymbol: string | null = null;
  try {
    const nameRaw = await ethers.provider.call({ to: proxyAddr, data: nameCalldata });
    if (nameRaw && nameRaw !== "0x") {
      probedName = TokenFactory.interface.decodeFunctionResult("name", nameRaw)[0];
    }
  } catch (e) {
    // probe failed — probably not initialized (or reverts). We'll avoid calling initialize blindly.
  }

  try {
    const symRaw = await ethers.provider.call({ to: proxyAddr, data: symbolCalldata });
    if (symRaw && symRaw !== "0x") {
      probedSymbol = TokenFactory.interface.decodeFunctionResult("symbol", symRaw)[0];
    }
  } catch (e) {
    // ignore
  }

  if (probedName && probedSymbol) {
    console.log(" Verified name/symbol (probe):", String(probedName), "/", String(probedSymbol));
  } else {
    console.warn("Could not read name/symbol from proxy via a read probe. The proxy may not have been initialized by constructor.");
    console.warn("To initialize manually (if safe), run:");
    console.warn(
      `  npx hardhat run --network ${networkName} -e \"const hre=require('hardhat');(async()=>{ const provider = hre.ethers.provider; const deployer = new hre.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider); const Token = await hre.ethers.getContractFactory('NektakTokenUpgradeable', deployer); const t = Token.attach('${proxyAddr}'); const tx = await t.initialize('${TOKEN_NAME}','${TOKEN_SYMBOL}'); console.log(tx.hash); })()\"`
    );
    console.warn("If manual initialize reverts with 'already initialized', then initialization already ran but the probe failed — check proxy/impl slot and your ABI.");
  }

  // --- NEW: attempt to transfer ownership to timelock proxy if available ---
  // Look for TIMELOCK_PROXY_ADDRESS in env first; fallback to deployments/<network>.json
  let timelockAddr: string | undefined = undefined;
  if (process.env.TIMELOCK_PROXY_ADDRESS && process.env.TIMELOCK_PROXY_ADDRESS !== "") {
    timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
    console.log("Found TIMELOCK_PROXY_ADDRESS in env:", timelockAddr);
  } else {
    // try deployments file
    try {
      const outPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
      if (fs.existsSync(outPath)) {
        const obj = JSON.parse(fs.readFileSync(outPath, "utf8"));
        timelockAddr = obj.contracts?.Timelock?.address ?? obj.Timelock?.address ?? timelockAddr;
      }
      if (timelockAddr) console.log("Found timelock in deployments file:", timelockAddr);
    } catch (e) {
      /* ignore */
    }
  }

  if (timelockAddr) {
    // Only attempt to transfer ownership if probe showed initialization succeeded (owner() will exist)
    if (probedName && probedSymbol) {
      try {
        const tokenAtProxy = TokenFactory.attach(proxyAddr).connect(deployer) as any;
        console.log("Attempting to transfer token ownership to timelock:", timelockAddr);
        let currentOwner: string | undefined;
        try {
          currentOwner = await tokenAtProxy.owner();
        } catch (ownerErr) {
          currentOwner = undefined;
        }

        if (currentOwner && currentOwner.toLowerCase() === timelockAddr.toLowerCase()) {
          console.log("Token owner already set to timelock:", timelockAddr);
        } else {
          const tx = await tokenAtProxy.transferOwnership(timelockAddr);
          await tx.wait();
          console.log("Transferred token ownership to timelock:", tx.hash);
        }
      } catch (e) {
        console.warn("Could not transfer token ownership to timelock automatically:", (e as any).message ?? e);
        console.log("You can transfer ownership manually using token.transferOwnership(<timelock>)");
      }
    } else {
      console.log("Skipping token.transferOwnership — token does not appear initialized or probe failed.");
      console.log("Once initialized, run: token.transferOwnership(<TIMELOCK_PROXY_ADDRESS>)");
    }
  } else {
    console.log("TIMELOCK_PROXY_ADDRESS not found in env or deployments file — skipping auto transfer of token ownership.");
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



















