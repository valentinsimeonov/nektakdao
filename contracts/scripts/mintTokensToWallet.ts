// contracts/scripts/mintTokensToWallet.ts
import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";
dotenv.config();

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}



async function main() {


  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const tokenAddr = process.env.TOKEN_PROXY_ADDRESS;
  if (!tokenAddr) throw new Error("TOKEN_PROXY_ADDRESS not set in .env");

  const recipient = process.env.RECIPIENT_ADDRESS;
  if (!recipient) throw new Error("RECIPIENT_ADDRESS not set in .env");

  const mintHuman = process.env.MINT_AMOUNT || "1000";

  // Create deployer wallet so transactions are signed locally
  const deployer = new ethers.Wallet(pk, ethers.provider);
  console.log("Using deployer:", deployer.address);
  console.log("Recipient:", recipient);
  console.log(`Mint amount (human): ${mintHuman} NKT`);

  // Attach to token contract at proxy address
  const token = await ethers.getContractAt("NektakTokenUpgradeable", tokenAddr, deployer) as any;

  // Print owner (if available)
  try {
    const owner = await token.owner();
    console.log("Token owner:", owner);
  } catch (e) {
    console.log("Token has no owner() or read failed (continuing) —", (e as any)?.message ?? e);
  }

  // Read decimals dynamically
  let decimals = 18;
  try {
    decimals = Number(await token.decimals());
    console.log("Token decimals:", decimals);
  } catch {
    console.log("Could not read decimals(), defaulting to 18");
  }

  // helper to format
  const fmt = (bn: bigint) => ethers.formatUnits(bn, decimals);

  // show totalSupply before
  try {
    const tsBefore = await token.totalSupply();
    console.log("Total supply before (raw):", tsBefore.toString());
    console.log("Total supply before (human):", fmt(tsBefore), "NKT");
  } catch {
    console.log("Could not read totalSupply()");
  }

  // Balance before
  const beforeRaw = await token.balanceOf(recipient);
  console.log("Balance before (raw):", beforeRaw.toString());
  console.log("Balance before (human):", fmt(beforeRaw), "NKT");

  // Parse amount to token units
  const amount = ethers.parseUnits(mintHuman, decimals); // bigint

  // Mint tokens to recipient (must be deployer/owner)
  console.log("Sending mint transaction...");
  const tx = await token.mint(recipient, amount);
  console.log("Mint tx hash:", tx.hash);

  // wait for receipt
  const receipt = await tx.wait();
  console.log("Mint tx confirmed in block:", receipt.blockNumber, "status:", receipt.status);

  // decode any Transfer events from receipt logs (use token.interface)
  try {
    for (const log of receipt.logs) {
      try {
        const parsed = token.interface.parseLog(log);
        if (parsed && parsed.name === "Transfer") {
          const from = parsed.args[0];
          const to = parsed.args[1];
          const value = parsed.args[2];
          console.log(`Decoded Transfer event -> from: ${from} to: ${to} value(raw): ${value.toString()} value(human): ${ethers.formatUnits(value, decimals)} NKT`);
        }
      } catch {
        // ignore logs that don't match
      }
    }
  } catch (e) {
    console.log("Could not parse logs:", (e as any)?.message ?? e);
  }

  // Poll balance a few times to allow provider to reflect new state (practical workaround)
  const maxAttempts = 12;
  let afterRaw = beforeRaw;
  for (let i = 0; i < maxAttempts; i++) {
    afterRaw = await token.balanceOf(recipient);
    if (afterRaw !== beforeRaw) {
      console.log(`Balance changed after ${i} attempt(s)`);
      break;
    }
    // brief pause then retry
    await sleep(1000);
  }

  console.log("Balance after (raw):", afterRaw.toString());
  console.log("Balance after (human):", fmt(afterRaw), "NKT");

  // show totalSupply after
  try {
    const tsAfter = await token.totalSupply();
    console.log("Total supply after (raw):", tsAfter.toString());
    console.log("Total supply after (human):", fmt(tsAfter), "NKT");
  } catch {
    // ignore
  }

  // helpful final check: did the increment equal the minted amount?
  const expectedAfter = beforeRaw + amount;
  if (afterRaw === expectedAfter) {
    console.log("Success: balance increased by exactly the minted amount.");
  } else {
    console.warn("Note: balance after did not equal before + minted amount. Raw values:");
    console.warn(" before:", beforeRaw.toString());
    console.warn(" amount:", amount.toString());
    console.warn(" after:", afterRaw.toString());
    console.warn(" expected after:", expectedAfter.toString());
    console.warn("If the explorer shows the expected value but script still doesn't, try increasing the polling attempts or check your provider caching.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });




