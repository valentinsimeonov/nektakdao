
// // contracts/scripts/deployTimelockUpgradeable.ts



import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { TimelockControllerUpgradeableUUPS } from "../typechain";
dotenv.config();


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

  // helper to parse comma-separated address lists from env (public addresses, not private keys)
  function splitAddrs(envVar?: string) {
    if (!envVar || envVar.trim() === "") return [];
    return envVar.split(",").map(s => s.trim()).filter(Boolean);
  }

  const envProposers = splitAddrs(process.env.TIMELOCK_PROPOSERS);
  const envExecutors = splitAddrs(process.env.TIMELOCK_EXECUTORS);

  const proposers = envProposers.length > 0 ? envProposers : [deployer.address];
  const executors = envExecutors.length > 0 ? envExecutors : [ethers.ZeroAddress];

  // allow explicit timelock admin override via TIMELOCK_ADMIN_ADDRESS; fallback to deployer
  const admin = process.env.TIMELOCK_ADMIN_ADDRESS && process.env.TIMELOCK_ADMIN_ADDRESS !== ""
    ? process.env.TIMELOCK_ADMIN_ADDRESS
    : deployer.address;

  console.log("Timelock Config:");
  console.log("  Min Delay:", MIN_DELAY, "seconds");
  console.log("  Initial Proposers:", proposers);
  console.log("  Executors:", executors);
  console.log("  Admin:", admin);
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
  console.log(" Deploying ERC1967Proxy (explicit tx & receipt check)...");
  const ProxyFactory = await ethers.getContractFactory("ERC1967ProxyWrapper", deployer);



  // create deploy transaction payload and send explicitly so we get a receipt and can verify code
  // NOTE: getDeployTransaction returns a Promise in some setups — await it.
  const deployTxPayload = await ProxyFactory.getDeployTransaction(implAddress, initData);
  const populated = await deployer.populateTransaction(deployTxPayload as any);
  // try to set a safe gas limit if provider can estimate (ethers v6 returns bigint)
  try {
    const gasEstimate: bigint = await ethers.provider.estimateGas({ ...populated, from: deployer.address }) as bigint;
    // use bigint arithmetic (no .mul/.div on bigint)
    populated.gasLimit = (gasEstimate * 120n / 100n) as any; // add 20% headroom, cast for TS
  } catch (e) {
    // ignore if estimate fails; RPCs vary
  }
  const sent = await deployer.sendTransaction(populated as any);






  console.log(" Proxy deploy tx hash:", sent.hash);
  // wait for the mined tx via the TransactionResponse.wait() method
  const receipt = await sent.wait();
  if (!receipt || receipt.status === 0) {
    console.error("Proxy deployment transaction failed or reverted. Receipt:", receipt);
    throw new Error("Proxy deployment reverted - aborting.");
  }
  const proxyAddress = receipt.contractAddress;
  if (!proxyAddress) {
    console.error("Proxy deployment receipt has no contractAddress. Receipt:", receipt);
    throw new Error("Proxy missing contractAddress - aborting.");
  }
  console.log(" Proxy deployed at:", proxyAddress);
  // Some RPCs take a moment to make the new contract code available — poll briefly
  let code = await ethers.provider.getCode(proxyAddress);
  let attempts = 0;
  while ((code === "0x" || code === "0x0") && attempts < 10) {
    await new Promise((r) => setTimeout(r, 1000));
    code = await ethers.provider.getCode(proxyAddress);
    attempts++;
  }
  console.log(" Proxy code length:", code.length, code === "0x" ? "(no code yet)" : "");
  console.log();







  // attach a convenience contract instance for later debug/usage
  var proxy = ProxyFactory.attach(proxyAddress);










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
  // Verify the deployment by calling through the proxy
  console.log(" Verifying deployment...");
  let minDelay;
  try {
    minDelay = await timelock.getMinDelay();
  } catch (e) {
    console.error("Failed to call getMinDelay() on the deployed proxy. This usually means the proxy has no code or wasn't initialized correctly.");
    throw e;
  }







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





