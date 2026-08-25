import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

dotenv.config({ path: ".env.local" });
dotenv.config();

const ARC_USDC = process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const walletId = process.env.CIRCLE_DEPLOYER_WALLET_ID;
  if (!apiKey || !entitySecret || !walletId) {
    throw new Error("Missing Circle credentials/deployer wallet. Run npm run circle:wallet and copy the printed values into .env.local.");
  }

  const artifactPath = path.join(process.cwd(), "artifacts/contracts/EscrowFactory.sol/EscrowFactory.json");
  const artifact = JSON.parse(await fs.readFile(artifactPath, "utf8"));
  const client = initiateSmartContractPlatformClient({ apiKey, entitySecret });

  const response = await client.deployContract({
    name: "ArcCreatorSettlementFactory",
    description: "USDC milestone escrow factory for global creator settlement on Arc",
    blockchain: "ARC-TESTNET",
    walletId,
    abiJson: JSON.stringify(artifact.abi),
    bytecode: artifact.bytecode,
    constructorParameters: [ARC_USDC],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } }
  });

  const data: any = response.data;
  const contractId = data?.contractId ?? data?.contractIds?.[0];
  const transactionId = data?.transactionId;
  console.log("\nCircle Contracts deployment submitted.");
  console.log(`contractId=${contractId ?? "unknown"}`);
  console.log(`transactionId=${transactionId ?? "unknown"}`);

  if (!contractId) {
    console.log("No contractId was returned. Check Circle Console for deployment status.");
    return;
  }

  console.log("Waiting for Circle Contracts deployment confirmation...");
  for (let attempt = 1; attempt <= 30; attempt++) {
    await sleep(3000);
    const result: any = await client.getContract({ id: contractId });
    const contract = result.data?.contract;
    const status = contract?.status ?? "PENDING";
    process.stdout.write(`Attempt ${attempt}/30: ${status}\r`);

    if (contract?.contractAddress) {
      console.log("\n\nDeployment complete.");
      console.log(`NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${contract.contractAddress}`);
      if (contract.txHash) console.log(`ARC_DEPLOYMENT_TX_HASH=${contract.txHash}`);
      console.log(`ArcScan: https://testnet.arcscan.app/address/${contract.contractAddress}`);
      return;
    }

    if (["FAILED", "ERROR"].includes(String(status).toUpperCase())) {
      throw new Error(`Circle Contracts deployment failed: ${contract?.deploymentErrorReason ?? status}`);
    }
  }

  console.log("\nDeployment is still pending. Check Circle Console using the contractId above.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
