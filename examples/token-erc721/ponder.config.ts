import type { PonderConfig } from "@ponder/core";

export const config: PonderConfig = {
  networks: [
    {
      name: "arbitrum",
      chainId: 42161,
      rpcUrl: process.env.PONDER_RPC_URL_42161,
    },
  ],
  contracts: [
    {
      name: "SmolBrain",
      network: "arbitrum",
      abi: "./abis/SmolBrain.json",
      address: "0x6325439389E0797Ab35752B4F43a14C004f22A9c",
      startBlock: 3163146,
    },
  ],
};
