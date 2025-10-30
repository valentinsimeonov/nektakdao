// contracts/scripts/deployGovernorUpgradeable.ts
import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

const OUT = path.join(__dirname, "..", "deployments");
function readDeploy(networkName: string) {
  const p = path.join(OUT, `${networkName}.json`);
  if (!fs.existsSync(p)) throw new Error("deployments file missing: " + p);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}



async function main() {


  const [deployer] = await ethers.getSigners();
  const network = (await ethers.provider.getNetwork()).name;
  const data = readDeploy(network);

  if (!data.Token || !data.Timelock) throw new Error("Need Token and Timelock deployed first");
  const tokenAddr = data.Token.proxy ?? data.Token.address ?? data.Token;
  const timelockAddr = data.Timelock.address ?? data.Timelock.proxy ?? data.Timelock;

  console.log("Deploying governor with token:", tokenAddr, "timelock:", timelockAddr);

  const Governor = await ethers.getContractFactory("NektakGovernorUpgradeable");
  const governor = await upgrades.deployProxy(Governor, [tokenAddr, timelockAddr], { initializer: "initialize", kind: "uups" });
  await governor.waitForDeployment();
  const govProxy = await governor.getAddress();
  const govImpl = await upgrades.erc1967.getImplementationAddress(govProxy);

  console.log("Governor proxy:", govProxy);
  console.log("Governor impl:", govImpl);

  // Save
  data.Governor = { proxy: govProxy, implementation: govImpl };
  data.timestamp = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, `${network}.json`), JSON.stringify(data, null, 2));

  // Grant PROPOSER_ROLE to Governor in Timelock (timelock deployed must be upgradeable timelock)
  const timelock = await ethers.getContractAt("TimelockControllerUpgradeable", timelockAddr, deployer);
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const grantTx = await timelock.grantRole(PROPOSER_ROLE, govProxy);
  await grantTx.wait();
  console.log("Granted PROPOSER_ROLE to governor:", govProxy);
}

main().catch((e) => { console.error(e); process.exit(1); });