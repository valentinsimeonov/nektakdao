// scripts/upgradeGovernor.ts
import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const hreEthers = (hre as any).ethers;
const OUT_DIR = path.join(__dirname, "..", "deployments");
function readDeployment(network: string) {
  const p = path.join(OUT_DIR, `${network}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const wallet = new hreEthers.Wallet(pk, hreEthers.provider);
  const net = await hreEthers.provider.getNetwork();
  const networkName = net.name || String(net.chainId);
  console.log("Network:", networkName, "from", wallet.address);

  const deployments = readDeployment(networkName);
  const governorProxy = process.env.GOVERNOR_PROXY_ADDRESS ?? deployments?.Governor?.proxy;
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS ?? deployments?.Timelock?.address ?? deployments?.Timelock?.proxy;
  if (!governorProxy) throw new Error("Governor proxy address not found; set GOVERNOR_PROXY_ADDRESS or include in deployments/<network>.json");
  if (!timelockAddr) throw new Error("Timelock address not found; set TIMELOCK_PROXY_ADDRESS or include in deployments/<network>.json");

  console.log("Governor proxy:", governorProxy);
  console.log("Timelock:", timelockAddr);

  // Deploy new implementation
  console.log("Deploying new Governor implementation...");
  const GovFactory = await hreEthers.getContractFactory("NektakGovernorUpgradeable", wallet);
  const impl = await GovFactory.deploy();
  await impl.waitForDeployment();
  const implAddr = await impl.getAddress();
  console.log("  New implementation deployed at:", implAddr);

  // UUPS upgrade calldata
  const uupsIface = new hreEthers.Interface(["function upgradeTo(address)"]);
  const upgradeCalldata = uupsIface.encodeFunctionData("upgradeTo", [implAddr]);

  // timelock contract instance (for helpful calls)
  const timelock = await hreEthers.getContractAt("TimelockControllerUpgradeable", timelockAddr, wallet) as any;

  // sanity: check proposer role
  try {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const hasProposer = await timelock.hasRole(PROPOSER_ROLE, wallet.address);
    console.log("Timelock PROPOSER_ROLE:", PROPOSER_ROLE);
    console.log("Deployer has proposer role:", hasProposer);
    if (!hasProposer) {
      throw new Error(`Deployer ${wallet.address} does not have PROPOSER_ROLE on timelock.`);
    }
  } catch (e) {
    console.warn("Could not verify PROPOSER_ROLE - scheduling may fail:", (e as any).message ?? e);
  }

  // minDelay
  let minDelaySeconds = 0;
  try { minDelaySeconds = Number(await timelock.getMinDelay()); } catch (e) { console.warn("Could not read getMinDelay()", e); }
  console.log("Timelock minDelay (s):", minDelaySeconds);

  // prepare inputs
  const predecessorZero = '0x' + '00'.repeat(32);
  const salt = hreEthers.keccak256(hreEthers.toUtf8Bytes("upgradeGovernor-" + Date.now()));
  const delay = Math.max(minDelaySeconds, 1);

  // We'll detect which overload is available and use the proper encoding/call
  // Build Interfaces for both overloads
  const tlIfaceArray = new hreEthers.Interface([
    "function schedule(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt, uint256 delay)",
    "function execute(address[] targets, uint256[] values, bytes[] datas, bytes32 predecessor, bytes32 salt)"
  ]);
  const tlIfaceSingle = new hreEthers.Interface([
    "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
    "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
  ]);

  // Try to detect array overload presence by checking contract ABI fragments (timelock.interface may be limited)
  const hasArrayOverload = (() => {
    try {
      const fn = (timelock.interface?.getFunction?.("schedule(address[]") ?? null);
      // above can throw or be undefined depending on provider; fallback to false
      return false; // don't rely on timelock.interface — we prefer to call single-target unless you know your timelock supports array form
    } catch { return false; }
  })();

  // For maximum compatibility call the single-target schedule (works for both older and newer timelocks).
  // Use schedule(target, value, data, predecessor, salt, delay)
  console.log("Scheduling upgrade via timelock (single-target schedule) — target:", governorProxy, "salt:", salt, "delay:", delay);

  const scheduleCallData = tlIfaceSingle.encodeFunctionData(
    "schedule(address,uint256,bytes,bytes32,bytes32,uint256)",
    [governorProxy, 0, upgradeCalldata, predecessorZero, salt, delay]
  );

  const scheduleTx = await wallet.sendTransaction({ to: timelockAddr, data: scheduleCallData });
  console.log(" schedule tx submitted, hash:", scheduleTx.hash);
  const scheduleRcpt = await scheduleTx.wait();
  console.log(" schedule tx mined:", scheduleRcpt.transactionHash);

  // Wait and execute if delay small
  if (delay <= 30) {
    const waitMs = (delay + 5) * 1000;
    console.log(`Waiting ${waitMs / 1000}s then attempting execute...`);
    await sleep(waitMs);

    const execCallData = tlIfaceSingle.encodeFunctionData(
      "execute(address,uint256,bytes,bytes32,bytes32)",
      [governorProxy, 0, upgradeCalldata, predecessorZero, salt]
    );

    try {
      const execTx = await wallet.sendTransaction({ to: timelockAddr, data: execCallData });
      const execRcpt = await execTx.wait();
      console.log("Executed upgrade via timelock. tx:", execRcpt.transactionHash);
      console.log("Governor proxy should now point to new implementation:", implAddr);
    } catch (e) {
      console.error("execute() failed (maybe still not ready):", (e as any).message ?? e);
      console.log("You can manually call execute after the delay with the same params.");
    }
  } else {
    console.log(`Delay > 30s (${delay}s). Run execute after the delay with same args.`);
  }

  // persist
  try {
    const outPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
    const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
    existing.Governor = { ...(existing.Governor ?? {}), implementation: implAddr, lastUpgradeSalt: salt };
    existing.timestamp = new Date().toISOString();
    fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
    console.log("Saved new implementation to deployments file.");
  } catch (e) {
    console.warn("Could not write deployments file:", (e as any).message ?? e);
  }
}

main().catch((err) => {
  console.error("Upgrade failed:", (err as any).message ?? err);
  process.exit(1);
});




