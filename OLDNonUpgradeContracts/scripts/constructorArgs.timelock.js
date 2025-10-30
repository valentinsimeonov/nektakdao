// scripts/constructorArgs.timelock.js
// Matches the parameters printed by your deploy script:
// ${timelock.address} ${CONFIG.timelockMinDelaySeconds} "[]" '["0x000..."]' "${deployer.address}"
module.exports = [
  1, // minDelay seconds (as number) — adjust if CONFIG.timelockMinDelaySeconds was different
  [], // proposers: real JS empty array
  ["0x0000000000000000000000000000000000000000"], // executors array
  "0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0" // admin/deployer
];