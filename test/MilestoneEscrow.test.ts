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

  it("allows the client to assign an unassigned creator before funding", async function () {
    const [client, creator, outsider] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const token = await MockUSDC.deploy();
    await token.waitForDeployment();
    const Factory = await ethers.getContractFactory("EscrowFactory");
    const factory = await Factory.deploy(await token.getAddress());
    await factory.waitForDeployment();

    await expect(factory.connect(client).createEscrow(
      ethers.ZeroAddress,
      "Open creator job",
      ["Proof"],
      [usdc("1")]
    )).to.emit(factory, "EscrowCreated").withArgs(
      (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value),
      client.address,
      ethers.ZeroAddress,
      "Open creator job",
      usdc("1")
    );

    const escrowAddress = await factory.escrows(0);
    const escrow = await ethers.getContractAt("MilestoneEscrow", escrowAddress);
    expect(await escrow.creator()).to.equal(ethers.ZeroAddress);
    await expect(escrow.connect(client).assignCreator(creator.address))
      .to.emit(escrow, "CreatorAssigned")
      .withArgs(client.address, creator.address);
    expect(await escrow.creator()).to.equal(creator.address);
    await expect(escrow.connect(outsider).assignCreator(outsider.address))
      .to.be.revertedWithCustomError(escrow, "OnlyClient");
    await expect(escrow.connect(client).assignCreator(outsider.address))
      .to.be.revertedWithCustomError(escrow, "CreatorAlreadyAssigned");
  });

  it("blocks funding until an unassigned escrow has a creator", async function () {
    const [client] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const token = await MockUSDC.deploy();
    await token.waitForDeployment();
    const Factory = await ethers.getContractFactory("EscrowFactory");
    const factory = await Factory.deploy(await token.getAddress());
    await factory.waitForDeployment();
    await factory.connect(client).createEscrow(ethers.ZeroAddress, "Open creator job", ["Proof"], [usdc("1")]);
    const escrow = await ethers.getContractAt("MilestoneEscrow", await factory.escrows(0));
    await expect(escrow.connect(client).deposit()).to.be.revertedWithCustomError(escrow, "CreatorNotAssigned");
  });
});
