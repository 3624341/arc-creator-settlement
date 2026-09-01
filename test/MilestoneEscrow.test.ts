import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

const usdc = (amount: string) => ethers.parseUnits(amount, 6);

describe("MilestoneEscrow", function () {
  async function deployFixture() {
    const [client, creator, outsider] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const token = await MockUSDC.deploy();
    await token.waitForDeployment();

    const Factory = await ethers.getContractFactory("EscrowFactory");
    const factory = await Factory.deploy(await token.getAddress());
    await factory.waitForDeployment();

    await token.mint(client.address, usdc("1000"));
    await factory.connect(client).createEscrow(
      creator.address,
      "Tokyo Skincare Campaign",
      ["Contract accepted", "Content produced"],
      [usdc("400"), usdc("600")]
    );
    const escrowAddress = await factory.escrows(0);
    const escrow = await ethers.getContractAt("MilestoneEscrow", escrowAddress);
    return { client, creator, outsider, token, factory, escrow };
  }

  it("deposits and releases a milestone", async function () {
    const { client, creator, token, escrow } = await deployFixture();
    await token.connect(client).approve(await escrow.getAddress(), usdc("1000"));
    await escrow.connect(client).deposit();

    expect(await token.balanceOf(await escrow.getAddress())).to.equal(usdc("1000"));

    await escrow.connect(creator).submitMilestone(0);
    await expect(escrow.connect(client).approveAndRelease(0))
      .to.emit(escrow, "PaymentReleased")
      .withArgs(0, creator.address, usdc("400"));

    expect(await token.balanceOf(creator.address)).to.equal(usdc("400"));
  });

  it("blocks non-client release", async function () {
    const { client, creator, outsider, token, escrow } = await deployFixture();
    await token.connect(client).approve(await escrow.getAddress(), usdc("1000"));
    await escrow.connect(client).deposit();
    await escrow.connect(creator).submitMilestone(0);
    await expect(escrow.connect(outsider).approveAndRelease(0)).to.be.revertedWithCustomError(escrow, "OnlyClient");
  });
});
