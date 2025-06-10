import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: "remote"
    },
    hardhat: {
      chainId: 31337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000" // 10k ETH
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test/hardhat",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;