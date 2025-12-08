// scripts/buildExecCalldata.ts
const hre = require("hardhat");

async function main() {
  const ethers = hre.ethers;
  const timelockAddress = "0x6EEE9840017D4fc58C8c9D657E65fe010D815484";

  // These MUST match the scheduled values exactly:
  const target = "0x90382F047bbc21d95736b96e803b53843087AB8a";
  const value = 0;
  const data = "0x3659cfe6000000000000000000000000442b5944ce9391edebd1b2eb55eb075a2ff4cc0c";
  const predecessor = "0x" + "00".repeat(32);
  const salt = "0xc7f114f57717998688646cad1227635ab10de7be7b985cfed3b99e1f859a754b";

  const abi = ["function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"];
  const iface = new ethers.Interface(abi);
  const calldata = iface.encodeFunctionData("execute", [target, value, data, predecessor, salt]);

  console.log("Timelock address:", timelockAddress);
  console.log("execute(...) calldata:", calldata);
  console.log("target:", target);
  console.log("value:", value);
  console.log("data:", data);
  console.log("predecessor:", predecessor);
  console.log("salt:", salt);
}

main().catch(e => { console.error(e); process.exit(1); });