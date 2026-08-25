import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const privateKey = process.env.ARC_TESTNET_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    arcTestnet: {
      url: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
      chainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
      accounts: privateKey ? [privateKey] : []
    }
  }
};

export default config;
