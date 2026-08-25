import dotenv from "dotenv";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey || !entitySecret) throw new Error("Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in .env.local first.");

  const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
  const walletSetResponse = await client.createWalletSet({ name: "Arc Creator Settlement Deployer" });
  const walletSetId = walletSetResponse.data?.walletSet?.id;
  if (!walletSetId) throw new Error("Circle wallet set creation returned no ID.");

  const walletResponse = await client.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "EOA"
  });
  const wallet = walletResponse.data?.wallets?.[0];
  if (!wallet?.id || !wallet?.address) throw new Error("Circle deployer wallet creation failed.");

  console.log("\nCircle deployer created.");
  console.log(`CIRCLE_DEPLOYER_WALLET_SET_ID=${walletSetId}`);
  console.log(`CIRCLE_DEPLOYER_WALLET_ID=${wallet.id}`);
  console.log(`CIRCLE_DEPLOYER_WALLET_ADDRESS=${wallet.address}`);
  console.log("\nThese IDs/addresses are not secrets. Copy them into .env.local.");
  console.log("Fund the public address with Arc Testnet USDC from the Circle Faucet before running npm run circle:deploy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
