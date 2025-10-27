

# start services (it won't run any command by default)
docker compose -f docker-compose.dev.yml up -d hardhat-cli
 docker compose -f docker-compose.dev.yml build hardhat-cli --no-cache


 
# open an interactive shell in the hardhat-cli container
docker compose -f docker-compose.dev.yml run --rm hardhat-cli bash

# inside container shell:
npm ci --legacy-peer-deps
npx hardhat compile --show-stack-traces
npx hardhat test --show-stack-traces




docker compose -f docker-compose.dev.yml build --no-cache frontend




### Deploy!

npx hardhat compile
npx hardhat run scripts/deploy.ts --network base_sepolia








# TESTNET EXPLORER


### Base Sepolia Testnet can verify here as well

https://sepolia.basescan.org/


### First Deployment

Token: 0x9340b85e01CB5500AfBa3f8A5AA98668732ff273

Timelock: 0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2

Governor: 0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540

Box: 0xEF535c19ED4831caAE5E074A1f2ddE23C9298C62



### Verify Deployment



#### Token


#### TOKEN 
npx hardhat verify --network base_sepolia --contract contracts/NektakToken.sol:NektakToken \
  --constructor-args ./scripts/constructorArgs.token.js \
  0x9340b85e01CB5500AfBa3f8A5AA98668732ff273

##### TIMELOCK 
npx hardhat verify --network base_sepolia --contract contracts/TimelockController.sol:TimelockController \
  --constructor-args ./scripts/constructorArgs.timelock.js \
  0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2

##### GOVERNOR
npx hardhat verify --network base_sepolia --contract contracts/NektakGovernor.sol:NektakGovernor \
  --constructor-args ./scripts/constructorArgs.governor.js \
  0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540

























# Deployment Details


nartex@compvos:~/vscode/nektakdao$ ./hardhat.sh shell
[INFO] Starting interactive shell in hardhat-cli container...
[+] Creating 5/5
 ✔ Network nektakdao_default                Created                 0.1s 
 ✔ Volume nektakdao_node_modules_contracts  Created                 0.0s 
 ✔ Volume nektakdao_hardhat_cache           Created                 0.0s 
 ✔ Volume nektakdao_hardhat_artifacts       Created                 0.0s 
 ✔ Volume nektakdao_hardhat_typechain       Created                 0.0s 
dev@6dd28d96d81d:/project/contracts$ 
dev@6dd28d96d81d:/project/contracts$ 
dev@6dd28d96d81d:/project/contracts$ 
dev@6dd28d96d81d:/project/contracts$ npx hardhat run scripts/deploy.ts --network base_sepolia
Downloading compiler 0.8.20
Compiled 45 Solidity files successfully
[deploy] Deploying with account: 0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0
[deploy] Deployer balance (ETH): 1.033018817718195524
[deploy] Network: base_sepolia
[deploy] Gas settings: { maxPriorityFeePerGas: '1.8', maxFeePerGas: '1.800000146' }

[1] Deploying Token: NektakToken
[1] Using nonce: 6
[1] Token deployment transaction sent: 0x29f7dcccb566997bb5cfcaea7f29225a13eaf7961e50f9c714ac6eb372698ed5
[deploy] Waiting for 1 confirmation(s)...
[1] NektakToken deployed at: 0x9340b85e01CB5500AfBa3f8A5AA98668732ff273

[2] Deploying TimelockController: TimelockController
[2] Using nonce: 7
[2] Timelock deployment transaction sent: 0xa3e572b12842583ed9efec3dc9d66c0c891f6908e97c11b0a81b0d1f927480f3
[deploy] Waiting for 1 confirmation(s)...
[2] TimelockController deployed at: 0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2

[3] Deploying Governor: NektakGovernor
[3] Using nonce: 8
[3] Governor deployment transaction sent: 0xc8146718dd1e4a2690edd6c4cd154f698b889b72e96ce48d3dc16b44473e884a
[deploy] Waiting for 1 confirmation(s)...
[3] NektakGovernor deployed at: 0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540

[4] Configuring Timelock roles...
[4] ✓ Granted PROPOSER_ROLE to Governor

[5] Deploying Vesting contract...
[5] Vesting deployment skipped: HH700: Artifact for contract "Vesting" not found. 

[6] Transferring token ownership to Timelock...
[6] Token ownership transfer failed: nonce has already been used [ See: https://links.ethers.org/v5-errors-NONCE_EXPIRED ] (error={"name":"ProviderError","_stack":"ProviderError: nonce too low: next nonce 10, tx nonce 9\n    at HttpProvider.request (/project/contracts/node_modules/hardhat/src/internal/core/providers/http.ts:88:21)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async EthersProviderWrapper.send (/project/contracts/node_modules/@nomiclabs/hardhat-ethers/src/internal/ethers-provider-wrapper.ts:13:20)","code":-32000,"_isProviderError":true}, method="sendTransaction", transaction=undefined, code=NONCE_EXPIRED, version=providers/5.7.2)
[deploy] Could not write file: EACCES: permission denied, open '/project/contracts/deployments/base_sepolia.json'

[deploy] Deployment data:
{
  "network": "base_sepolia",
  "timestamp": "2025-10-23T11:30:59.579Z",
  "deployer": "0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0",
  "contracts": {
    "NektakToken": {
      "address": "0x9340b85e01CB5500AfBa3f8A5AA98668732ff273"
    },
    "TimelockController": {
      "address": "0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2"
    },
    "NektakGovernor": {
      "address": "0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540"
    }
  }
}

======================================================================
                    DEPLOYMENT SUCCESSFUL
======================================================================
┌─────────┬──────────────────────┬──────────────────────────────────────────────┐
│ (index) │       Contract       │                   Address                    │
├─────────┼──────────────────────┼──────────────────────────────────────────────┤
│    0    │    'NektakToken'     │ '0x9340b85e01CB5500AfBa3f8A5AA98668732ff273' │
│    1    │ 'TimelockController' │ '0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2' │
│    2    │   'NektakGovernor'   │ '0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540' │
└─────────┴──────────────────────┴──────────────────────────────────────────────┘

📝 Contract Verification Commands:

Token:
  npx hardhat verify --network base_sepolia 0x9340b85e01CB5500AfBa3f8A5AA98668732ff273 "Nektak Token" "NKT"

Timelock:
  npx hardhat verify --network base_sepolia 0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2 1 "[]" '["0x0000000000000000000000000000000000000000"]' "0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0"

Governor:
  npx hardhat verify --network base_sepolia 0x3803cEc7f7c4B6acE16fFaDe010F4C63e9B21540 0x9340b85e01CB5500AfBa3f8A5AA98668732ff273 0xe75AFbd91b46b1Fe4D368d7b810c4B41D453eAf2

======================================================================
✅ All deployments complete! Next steps:
  1. Verify contracts on BaseScan (commands above)
  2. Save addresses to documentation
  3. Test governance flow
======================================================================
npm notice
npm notice New major version of npm available! 10.7.0 -> 11.6.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.2
npm notice To update run: npm install -g npm@11.6.2
npm notice
dev@6dd28d96d81d:/project/contracts$ exit
exit
nartex@compvos:~/vscode/nektakdao$ 
nartex@compvos:~/vscode/nektakdao$ 
nartex@compvos:~/vscode/nektakdao$ 





dev@f326314a1e48:/project/contracts$ 
dev@f326314a1e48:/project/contracts$ npx hardhat run scripts/deployBox.ts --network base_sepolia
Downloading compiler 0.8.20
Compiled 2 Solidity files successfully
[deployBox] deploying with 0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0
[deployBox] deployer ETH balance: 0.818226726745229436
Nothing to compile
No need to generate any newer typings.
[deployBox] using nonce: 13
[deployBox] tx: 0x7b5e8accd7f03dee87e1117b646cbbf1160d8b17df4e41be199b40a4fda714ce
[deployBox] Box deployed at: 0xEF535c19ED4831caAE5E074A1f2ddE23C9298C62
[deployBox] Could not write deployments file (permission?), printing to stdout instead
{
  "network": "base_sepolia",
  "timestamp": "2025-10-27T14:06:22.735Z",
  "deployer": "0x9623B00BdBC5dA9C8d9Fa2a352E96B3EEd569eC0",
  "contracts": {
    "Box": {
      "address": "0xEF535c19ED4831caAE5E074A1f2ddE23C9298C62"
    }
  }
}
[deployBox] done.













### Test RPCs

https://chainlist.org/chain/84532





