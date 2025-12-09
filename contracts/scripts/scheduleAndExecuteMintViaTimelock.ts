//scripts/scheduleAndInspectMintViaTimelock.ts
import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";
dotenv.config();

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
  const tokenAddr = process.env.TOKEN_PROXY_ADDRESS;
  if (!tokenAddr) throw new Error("TOKEN_PROXY_ADDRESS not set in .env");
  const timelockAddr = process.env.TIMELOCK_PROXY_ADDRESS;
  if (!timelockAddr) throw new Error("TIMELOCK_PROXY_ADDRESS not set in .env");
  const recipient = process.env.RECIPIENT_ADDRESS;
  if (!recipient) throw new Error("RECIPIENT_ADDRESS not set in .env");
  const mintHuman = process.env.MINT_AMOUNT || "1000";

  const signer = new ethers.Wallet(pk, ethers.provider);
  console.log("Signer:", signer.address);
  console.log("Token:", tokenAddr);
  console.log("Timelock:", timelockAddr);
  console.log("Recipient:", recipient);
  console.log("Mint (human):", mintHuman);

  const TokenFactory = await ethers.getContractFactory("NektakTokenUpgradeable", signer);
  const token = TokenFactory.attach(tokenAddr) as any;
  const Timelock = await ethers.getContractFactory("TimelockControllerUpgradeable", signer);
  const timelock = Timelock.attach(timelockAddr) as any;
  // sanity: show current owner
  try {
    const owner = await token.owner();
    console.log("token.owner():", owner);
    if (owner.toLowerCase() !== timelockAddr.toLowerCase()) {
      console.warn("WARNING: token.owner() is not the timelock. Mint via timelock will revert. Aborting.");
      return;
    }
  } catch (e) {
    console.warn("Could not read token.owner():", (e as any).message ?? e);
  }

  const decimals = Number(await token.decimals().catch(() => 18));
  const amount = ethers.parseUnits(mintHuman, decimals);

  // prepare calldata
  const mintCalldata = TokenFactory.interface.encodeFunctionData("mint", [recipient, amount]);

  // deterministic salt and ZERO_BYTES32 string (portable)
  const ZERO_BYTES32 = "0x" + "0".repeat(64);
 const salt = ethers.keccak256(ethers.toUtf8Bytes("mint-test-salt-" + Date.now()));

  // compute hashOperation if available (for debug only)
  let opId: string | undefined;
  try {
    opId = await timelock.hashOperation(tokenAddr, 0, mintCalldata, ZERO_BYTES32, salt);
  } catch (e) {
    opId = undefined;
  }
  if (opId) console.log("Timelock opId (hashOperation):", opId);

  // read minDelay
  const minDelay: bigint = await timelock.getMinDelay();
  console.log("Timelock minDelay (secs):", minDelay.toString());
  // schedule
  console.log("Scheduling...");
 const scheduleTx = await timelock.schedule(tokenAddr, 0, mintCalldata, ZERO_BYTES32, salt, minDelay);
  const scheduleRcpt = await scheduleTx.wait();
  console.log(" schedule tx:", scheduleTx.hash, "status:", scheduleRcpt.status);
  console.log(" schedule receipt logs count:", scheduleRcpt.logs?.length ?? 0);

  // wait
  const waitMs = Number(minDelay) * 1000 + 4000;
  console.log(`Waiting ${waitMs} ms (minDelay + buffer) before executing...`);
  await sleep(waitMs);

  // execute
  console.log("Executing...");
  const execTx = await timelock.execute(tokenAddr, 0, mintCalldata, ZERO_BYTES32, salt, { gasLimit: 1_000_000 });
  const execRcpt = await execTx.wait();
  console.log(" execute tx:", execTx.hash, "status:", execRcpt.status);
  console.log(" execute receipt logs count:", execRcpt.logs?.length ?? 0);

  // decode logs against token iface and Transfer topic fallback
  const transferSig = ethers.id("Transfer(address,address,uint256)");
  let foundTransfer = false;
  for (const log of execRcpt.logs) {
    // Try decode via token iface (preferred)
    try {
      const parsed = TokenFactory.interface.parseLog(log);
      console.log("DECODED token log:", parsed.name, parsed.args);
      if (parsed.name === "Transfer") {
        foundTransfer = true;
       console.log("Transfer -> from:", parsed.args[0], "to:", parsed.args[1], "value(raw):", parsed.args[2].toString());
      }
      continue;
    } catch {
      // ignore and try topic fallback below
    }

    // fallback: decode raw Transfer topic logs
    if (Array.isArray(log.topics) && log.topics[0] === transferSig) {
      try {
        // topics[1] and topics[2] are 32-byte hex; last 40 hex chars = address
        const rawFrom = (log.topics[1] ?? "").slice(-40);
        const rawTo = (log.topics[2] ?? "").slice(-40);
        const from = rawFrom ? "0x" + rawFrom : "0x0000000000000000000000000000000000000000";
        const to = rawTo ? "0x" + rawTo : "0x0000000000000000000000000000000000000000";
        const value = BigInt(log.data ?? "0x0");
        console.log("RAW Transfer log -> from:", from, "to:", to, "value(raw):", value.toString());
        foundTransfer = true;
      } catch (ee) {
        // ignore parse failure
      }
    }
  }

  // Final state checks
  const bal = await token.balanceOf(recipient);
 console.log("Recipient balance (raw):", bal.toString(), "human:", ethers.formatUnits(bal, decimals));
  const totalSupply = await token.totalSupply();
  console.log("Total supply (raw):", totalSupply.toString(), "human:", ethers.formatUnits(totalSupply, decimals));

  if (!foundTransfer) {
    console.warn("No Transfer event decoded in execute receipt logs. That suggests the mint call may not have executed (or Transfer came from another contract). Inspect transaction on explorer and the execute receipt above.");
  } else {
    console.log("Found Transfer in logs (or equivalent). If recipient balance still 0, the Transfer may not be to the expected address — check the decoded 'to' above.");
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});




