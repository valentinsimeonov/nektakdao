  // 1b) Optionally mint initial allocations
  if (CONFIG.initialAllocations && CONFIG.initialAllocations.length > 0) {
    console.log("Minting initial allocations...");
    for (const alloc of CONFIG.initialAllocations) {
      const tx = await token.mint(alloc.to, alloc.amount);
      await tx.wait();
      console.log(`  Minted ${hre.ethers.utils.formatUnits(alloc.amount, 18)} tokens to ${alloc.to}`);
    }
  } else {
    console.log("No initial allocations configured. Use governance to mint tokens later.");
  }










  // 4) Set Timelock roles
  try {
    console.log("\n4) Configuring Timelock roles...");
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();

    console.log("Roles:", {
      PROPOSER_ROLE,
      EXECUTOR_ROLE,
      TIMELOCK_ADMIN_ROLE
    });

    // Grant PROPOSER role to governor
    const grantProposerTx = await timelock.grantRole(PROPOSER_ROLE, governor.address);
    await grantProposerTx.wait();
    console.log(" Granted PROPOSER role to Governor");

    // Optional: Revoke admin role from deployer (for production)
    // const revokeAdminTx = await timelock.revokeRole(TIMELOCK_ADMIN_ROLE, deployer.address);
    // await revokeAdminTx.wait();
    // console.log("✓ Revoked TIMELOCK_ADMIN_ROLE from deployer");

  } catch (error: any) {
    console.error("Warning: Could not configure timelock roles:", error?.message || error);
  }


  













  