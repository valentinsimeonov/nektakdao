// contracts/scripts/deployGovernorUpgradeable.ts
import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const OUT_DIR = path.join(__dirname, "..", "deployments");
const PROXY_WRAPPER_NAME = "ERC1967ProxyWrapper"; // make sure this contract exists

function ensureOut() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function pathForNetworkName(name: string) {
  return path.join(OUT_DIR, `${name}.json`);
}

function safeJsonRead(p: string) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

async function locateDeployFile(networkName: string, chainId: number) {
  const tried: string[] = [];
  // try exact networkName first
  const cand1 = pathForNetworkName(networkName);
  tried.push(cand1);
  if (fs.existsSync(cand1)) return { path: cand1, data: safeJsonRead(cand1) };

  // try some common alternatives
  const altNames = [
    "base_sepolia",
    "base-sepolia",
    "baseSepolia",
    "sepolia",
    String(chainId),
  ];
  for (const alt of altNames) {
    const p = pathForNetworkName(alt);
    tried.push(p);
    if (fs.existsSync(p)) return { path: p, data: safeJsonRead(p) };
  }
  return { path: tried[0], data: null, tried };
}

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const wallet = new ethers.Wallet(pk, ethers.provider);
  const net = await ethers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  const chainId = Number(net.chainId); // <-- convert bigint -> number to satisfy TS

  console.log("Network:", networkName, "chainId:", chainId);
  console.log("Deploying governor from:", wallet.address);

  // locate deployments file and data
  const located = await locateDeployFile(networkName, chainId);
  let data = located.data;

  // If file missing or doesn't include Token/Timelock, try env vars
  let tokenAddr: string | undefined;
  let timelockAddr: string | undefined;

  if (data && (data.Token || data.Timelock)) {
    tokenAddr = data.Token?.proxy ?? data.Token?.address ?? data.Token;
    timelockAddr = data.Timelock?.address ?? data.Timelock?.proxy ?? data.Timelock;
  }

  // fallback to environment variables if missing
  if (!tokenAddr && process.env.TOKEN_PROXY_ADDRESS) {
    tokenAddr = process.env.TOKEN_PROXY_ADDRESS;
    console.log("Using TOKEN_PROXY_ADDRESS from .env");
  }
  if (!timelockAddr && process.env.TIMELOCK_PROXY_ADDRESS) {
    timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
    console.log("Using TIMELOCK_PROXY_ADDRESS from .env");
  }

  if (!tokenAddr || !timelockAddr) {
    console.error("Could not find Token and/or Timelock addresses.");
    console.error("Looked in:", (located as any).tried ?? pathForNetworkName(networkName));
    console.error("You can either populate deployments/<network>.json or set env vars TOKEN_PROXY_ADDRESS and TIMELOCK_PROXY_ADDRESS.");
    throw new Error("Need Token and Timelock deployed first (and available in deployments file or env).");
  }

  console.log("Using token:", tokenAddr);
  console.log("Using timelock:", timelockAddr);

  // Deploy Governor implementation
  const GovFactory = await ethers.getContractFactory("NektakGovernorUpgradeable", wallet);
  console.log("Deploying Governor implementation...");
  const impl = await GovFactory.deploy();
  await impl.waitForDeployment();
  const implAddr = await impl.getAddress();
  console.log("Governor implementation:", implAddr);

  // encode initialize(tokenAddr, timelockAddr)
  const initCalldata = GovFactory.interface.encodeFunctionData("initialize", [tokenAddr, timelockAddr]);

  // Deploy proxy wrapper with init calldata (fall back to manual init if constructor fails)
  const ProxyFactory = await ethers.getContractFactory(PROXY_WRAPPER_NAME, wallet);
  let proxy: any;
  try {
    console.log("Deploying proxy (with initializer)...");
    proxy = await ProxyFactory.deploy(implAddr, initCalldata);
    await proxy.waitForDeployment();
  } catch (err) {
    console.warn("Proxy constructor with initializer failed, deploying proxy without init and calling initialize manually:", (err as any).message ?? err);
    proxy = await ProxyFactory.deploy(implAddr, "0x");
    await proxy.waitForDeployment();
    const proxyAddressTemp = await proxy.getAddress();
    const govAtProxyTemp = GovFactory.attach(proxyAddressTemp).connect(wallet) as any;
    console.log("Calling initialize() manually on proxy...");
    const tx = await govAtProxyTemp.initialize(tokenAddr, timelockAddr);
    await tx.wait();
    console.log("Manual initialize tx:", tx.hash);
  }

  const proxyAddr = await proxy.getAddress();
  console.log("Governor proxy deployed at:", proxyAddr);

  // Save into deployments file
  ensureOut();
  const outPath = pathForNetworkName(networkName);
  const existing = safeJsonRead(outPath) ?? {};
  existing.Governor = { proxy: proxyAddr, implementation: implAddr };
  existing.timestamp = new Date().toISOString();
  existing.deployer = wallet.address;
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  console.log("Saved governor to:", outPath);

  // Grant PROPOSER_ROLE to governor in timelock (connect as deployer)
  console.log("Granting PROPOSER_ROLE to governor on timelock...");
  const timelock = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr, wallet) as any;
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const already = await timelock.hasRole(PROPOSER_ROLE, proxyAddr);
  if (!already) {
    const grantTx = await timelock.grantRole(PROPOSER_ROLE, proxyAddr);
    await grantTx.wait();
    console.log("Granted PROPOSER_ROLE to governor:", proxyAddr);
  } else {
    console.log("Governor already has PROPOSER_ROLE");
  }

  console.log("Governor deploy + configuration complete.");
}

main().catch((err) => {
  console.error("Deployment failed:", (err as any).message ?? err);
  process.exit(1);
});