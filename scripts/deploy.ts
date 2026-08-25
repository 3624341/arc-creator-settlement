import { ethers } from "hardhat";

const ARC_USDC = process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying EscrowFactory with:", deployer.address);
  console.log("USDC:", ARC_USDC);

  const Factory = await ethers.getContractFactory("EscrowFactory");
  const factory = await Factory.deploy(ARC_USDC);
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("EscrowFactory deployed:", address);
  console.log(`Set NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
