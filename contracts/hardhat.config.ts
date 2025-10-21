





import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Ignore EVM version warning for 0.8.20
      evmVersion: "paris", // Use Paris instead of default to avoid issues
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: process.env.HARDHAT_NETWORK_URL || "http://127.0.0.1:8545",
      chainId: 1337,
    },
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    base_mainnet: {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;




















// import { HardhatUserConfig } from "hardhat/config";
// import "@nomiclabs/hardhat-ethers";
// import "dotenv/config";

// const config: HardhatUserConfig = {
//   solidity: { compilers: [{ version: "0.8.20" }] },
//   networks: {
//     hardhat: {}
//     // add Base/testnets via env when ready, e.g.
//     // base: { url: process.env.BASE_RPC_URL, accounts: [process.env.DEPLOYER_PRIVATE_KEY] }
//   }
// };

// export default config;