
//contracts/hardhat.config.ts

import { HardhatUserConfig as HHConfigBase } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
// import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-etherscan";
dotenv.config();



type EtherscanConfig = {
  // apiKey?: string | { [network: string]: string };
  base_sepolia?: string | { [network: string]: string };
  base?: string | { [network: string]: string };

  customChains?: Array<{
    network: string;
    chainId: number;
    urls: { apiURL: string; browserURL: string };
  }>;
};

type HardhatUserConfig = HHConfigBase & { etherscan?: EtherscanConfig };




const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
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
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 84532,
    },
    base_mainnet: {
      url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    // apiKey: process.env.ETHERSCAN_KEY,
    base_sepolia: process.env.ETHERSCAN_KEY || "",
    base: process.env.ETHERSCAN_KEY || "",
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base_mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
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




