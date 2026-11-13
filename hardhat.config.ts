import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import { configVariable, defineConfig } from "hardhat/config";

const envFile = new URL("./.env", import.meta.url);
if (existsSync(envFile)) loadEnvFile(envFile);

export default defineConfig({
  plugins: [hardhatEthers, hardhatNodeTestRunner],
  solidity: "0.8.28",
  networks: {
    localhost: {
      type: "http",
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
