const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BasicLottery", function () {
  let BasicLottery, basicLottery, owner, addr1, addr2;
  let minEntryFee, maxParticipants, lotteryDuration;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    minEntryFee = ethers.parseEther("0.01");
    maxParticipants = 100;
    lotteryDuration = 7n * 24n * 60n * 60n;

    BasicLottery = await ethers.getContractFactory("BasicLottery");
    basicLottery = await BasicLottery.deploy(minEntryFee, maxParticipants, lotteryDuration);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await basicLottery.owner()).to.equal(owner.address);
    });

    it("Should set the correct minimum entry fee", async function () {
      expect(await basicLottery.minEntryFee()).to.equal(minEntryFee);
    });
  });

  describe("Entering lottery", function () {
    it("Should allow entering with sufficient fee", async function () {
      await expect(basicLottery.connect(addr1).enter({ value: minEntryFee }))
        .to.emit(basicLottery, "ParticipantEntered")
        .withArgs(addr1.address, minEntryFee);

      const participants = await basicLottery.getParticipants();
      expect(participants[0]).to.equal(addr1.address);
    });

    it("Should reject entry with insufficient fee", async function () {
      const insufficientFee = minEntryFee - 1n;
      await expect(basicLottery.connect(addr1).enter({ value: insufficientFee }))
        .to.be.revertedWithCustomError(basicLottery, "InsufficientEntryFee");
    });
  });

  describe("Picking winner", function () {
    it("Should only allow owner to pick winner", async function () {
      await basicLottery.connect(addr1).enter({ value: minEntryFee });
      await expect(basicLottery.connect(addr1).pickWinner())
        .to.be.revertedWithCustomError(basicLottery, "OwnableUnauthorizedAccount");
    });

    it("Should pick a winner and transfer balance", async function () {
      await basicLottery.connect(addr1).enter({ value: minEntryFee });
      await basicLottery.connect(addr2).enter({ value: minEntryFee });

      await ethers.provider.send("evm_increaseTime", [Number(lotteryDuration)]);
      await ethers.provider.send("evm_mine");

      const totalPrize = minEntryFee * 2n;

      await expect(basicLottery.pickWinner())
        .to.emit(basicLottery, "WinnerPicked")
        .withArgs(await basicLottery.participants(0), totalPrize);

      expect(await basicLottery.getBalance()).to.equal(0);
    });
  });
});