// // contracts/scripts/deployTimelockUpgradeable.ts



import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import { TimelockControllerUpgradeableUUPS } from "../typechain";



const OUTPUT_DIR = path.join(__dirname, "..", "deployments");

interface DeploymentData {
  network: string;
  timestamp: string;
  deployer: string;
  contracts: {
    Timelock?: { address: string; implementation: string; minDelay: number };
    Token?: { proxy: string; implementation: string };
    Governor?: { proxy: string; implementation: string };
  };
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function saveDeployment(network: string, deployer: string, updates: any) {
  ensureOutputDir();
  const outPath = path.join(OUTPUT_DIR, `${network}.json`);
  
  let data: DeploymentData = {
    network,
    timestamp: new Date().toISOString(),
    deployer,
    contracts: {},
  };

  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    data = { ...existing, timestamp: new Date().toISOString() };
  }

  data.contracts = { ...data.contracts, ...updates };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Saved to: ${outPath}`);
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error(" DEPLOYER_PRIVATE_KEY is not set in env");

  const deployer = new ethers.Wallet(pk, ethers.provider);
  const network = (await ethers.provider.getNetwork()).name;
  
  console.log("=".repeat(60));
  console.log("STEP 1: Deploy TimelockController (Manual UUPS)");
  console.log("=".repeat(60));
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Timelock parameters
  const MIN_DELAY = process.env.TIMELOCK_MIN_DELAY 
    ? parseInt(process.env.TIMELOCK_MIN_DELAY) 
    : 1;
  
  const proposers = [deployer.address];
  const executors = [ethers.ZeroAddress];
  const admin = deployer.address;

  console.log("Timelock Config:");
  console.log("  Min Delay:", MIN_DELAY, "seconds");
  console.log("  Initial Proposer:", deployer.address);
  console.log("  Executors: [anyone]");
  console.log();

  // Step 1: Deploy Implementation
  console.log("⏳ Deploying Timelock Implementation...");
  const TimelockFactory = await ethers.getContractFactory(
    "TimelockControllerUpgradeableUUPS",
    deployer
  );
  const implementation = await TimelockFactory.deploy();
  await implementation.waitForDeployment();
  const implAddress = await implementation.getAddress();
  console.log(" Implementation deployed at:", implAddress);

  // Step 2: Encode initialize call
  const initData = TimelockFactory.interface.encodeFunctionData(
    "initialize",
    [MIN_DELAY, proposers, executors, admin]
  );

  // Step 3: Deploy ERC1967Proxy
  console.log(" Deploying ERC1967Proxy...");
  const ProxyFactory = await ethers.getContractFactory("ERC1967ProxyWrapper", deployer);
  const proxy = await ProxyFactory.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(" Proxy deployed at:", proxyAddress);
  console.log();




// === DEBUG: inspect proxy & implementation low-level state ===
const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

function addressToStorageValue(address: string) {
  return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

async function getStorageAtAnyProvider(provider: any, address: string, slot: string) {
  // Use JSON-RPC directly which works with hardhat/infura/alchemy/others
  try {
    const res = await provider.send("eth_getStorageAt", [address, slot, "latest"]);
    return res as string;
  } catch (err) {
    // Fallback: if provider has getStorage (hardhat shim), use it
    if (typeof provider.getStorage === "function") {
      return (await provider.getStorage(address, slot)) as string;
    }
    throw err;
  }
}

async function getTransactionReceiptAnyProvider(provider: any, txHash: string) {
  try {
    return await provider.getTransactionReceipt(txHash);
  } catch (err) {
    // fallback to RPC
    return await provider.send("eth_getTransactionReceipt", [txHash]);
  }
}

async function debugProxy(proxyAddr: string, implAddr: string, proxyContractInstance: any) {
  console.log("DEBUG: proxy:", proxyAddr);
  console.log("DEBUG: impl :", implAddr);

  const codeProxy = await ethers.provider.getCode(proxyAddr);
  const codeImpl = await ethers.provider.getCode(implAddr);
  console.log("DEBUG: code at proxy length:", codeProxy.length, codeProxy === "0x" ? "(no code)" : "");
  console.log("DEBUG: code at impl  length:", codeImpl.length, codeImpl === "0x" ? "(no code)" : "");

  // get storage slot via eth_getStorageAt (works on all providers)
  let implSlotRaw = "(unavailable)";
  try {
    implSlotRaw = await getStorageAtAnyProvider(ethers.provider, proxyAddr, IMPLEMENTATION_SLOT);
  } catch (e) {
    console.warn("DEBUG: getStorageAt failed:", (e as any).message ?? e);
  }
  console.log("DEBUG: impl slot raw:", implSlotRaw);
  console.log("DEBUG: expected impl slot:", addressToStorageValue(implAddr));
  console.log("DEBUG: impl slot matches impl address:", implSlotRaw === addressToStorageValue(implAddr));

  // low-level call for getter
  try {
    const iface = TimelockFactory.interface;
    const callData = iface.encodeFunctionData("getMinDelay", []);
    const callResultHex = await ethers.provider.call({ to: proxyAddr, data: callData });
    console.log("DEBUG: raw call result for getMinDelay:", callResultHex);
    try {
      const decoded = iface.decodeFunctionResult("getMinDelay", callResultHex);
      console.log("DEBUG: decoded getMinDelay:", decoded[0].toString());
    } catch {
      console.warn("DEBUG: could not decode getMinDelay result (likely empty/reverted).");
    }
  } catch (e) {
    console.warn("DEBUG: low-level call failed:", (e as any).message ?? e);
  }

  // Try to find the deploy tx hash and receipt
  let txHash: string | undefined = undefined;
  try {
    // ethers v6: deployment tx may be available at .deploymentTransaction or .deployTransaction
    txHash = (proxyContractInstance as any).deploymentTransaction?.hash ?? (proxyContractInstance as any).deployTransaction?.hash;
    if (!txHash) {
      // no tx on the instance; try to locate via provider by searching recent blocks (not ideal)
      console.warn("DEBUG: no deploy tx hash available on contract instance");
    } else {
      console.log("DEBUG: proxy deploy tx hash:", txHash);
      const receipt = await getTransactionReceiptAnyProvider(ethers.provider, txHash);
      console.log("DEBUG: proxy deploy receipt:", receipt?.status ? "status=" + receipt.status : receipt);
    }
  } catch (e) {
    console.warn("DEBUG: could not fetch tx receipt:", (e as any).message ?? e);
  }
}



await debugProxy(proxyAddress, implAddress, proxy);








  // Step 4: Get contract instance at proxy address
  // const timelock = TimelockFactory.attach(proxyAddress) as any;
const timelock = TimelockFactory.attach(proxyAddress) as TimelockControllerUpgradeableUUPS;
  // Verify the deployment
  console.log(" Verifying deployment...");
  const minDelay = await timelock.getMinDelay();
  console.log("   Min Delay:", minDelay.toString(), "seconds");
  
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const hasProposerRole = await timelock.hasRole(PROPOSER_ROLE, deployer.address);
  console.log("   Deployer has PROPOSER_ROLE:", hasProposerRole);
  
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const hasExecutorRole = await timelock.hasRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  console.log("   Anyone can execute:", hasExecutorRole);
  console.log();

  // Save deployment
  saveDeployment(network, deployer.address, {
    Timelock: {
      address: proxyAddress,
      implementation: implAddress,
      minDelay: MIN_DELAY,
    },
  });

  console.log("=".repeat(60));
  console.log("STEP 1 COMPLETE");
  console.log("=".repeat(60));
  console.log(" Summary:");
  console.log("   Timelock Proxy:", proxyAddress);
  console.log("   Implementation:", implAddress);
  console.log("   Min Delay:", MIN_DELAY, "seconds");
  console.log();
  console.log("  Next: Run deploy-2-token.ts");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });





