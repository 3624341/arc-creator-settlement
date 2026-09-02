import dotenv from "dotenv";
import { generateEntitySecret, registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
import { ensureRecoveryDirectory } from "../lib/circle-recovery";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const action = process.argv[2];

  if (action === "generate") {
    const secret = generateEntitySecret();
    console.log("\nGenerated Circle Entity Secret (store this securely; do NOT share it):");
    console.log(secret);
    console.log("\nPut it in CIRCLE_ENTITY_SECRET inside .env.local, then run: npm run circle:entity:register");
    return;
  }

  if (action === "register") {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    if (!apiKey || !entitySecret) throw new Error("Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in .env.local first.");

    const recoveryFileDownloadPath = ensureRecoveryDirectory("./recovery");
    const response = await registerEntitySecretCiphertext({
      apiKey,
      entitySecret,
      recoveryFileDownloadPath
    });
    console.log("\nEntity Secret registered with Circle.");
    console.log("Recovery file response:", response.data?.recoveryFile ?? response.data);
    console.log("\nMove the recovery file to a secure location and never commit it to GitHub.");
    return;
  }

  throw new Error("Usage: npm run circle:entity:generate OR npm run circle:entity:register");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
