import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-truffle5";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const MEZO_TESTNET_RPC_URL = process.env.MEZO_TESTNET_RPC_URL ?? "https://rpc.test.mezo.org";
const MEZO_MAINNET_RPC_URL = process.env.MEZO_MAINNET_RPC_URL ?? "https://rpc-http.mezo.boar.network";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    mezotestnet: {
      url: MEZO_TESTNET_RPC_URL,
      chainId: 31611,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    mezomainnet: {
      url: MEZO_MAINNET_RPC_URL,
      chainId: 31612,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: { target: "truffle-v5" },
};

export default config;
