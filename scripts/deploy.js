const hre = require("hardhat");

async function main() {
  const minEntryFee = hre.ethers.parseEther("0.01");
  const maxParticipants = 100;
  const lotteryDuration = 7n * 24n * 60n * 60n; 

  const BasicLottery = await hre.ethers.getContractFactory("BasicLottery");
  const basicLottery = await BasicLottery.deploy(minEntryFee, maxParticipants, lotteryDuration);

  await basicLottery.waitForDeployment();

  const contractAddress = await basicLottery.getAddress();
  console.log("BasicLottery deployed to:", contractAddress);

  console.log("Waiting for block confirmations...");
  await basicLottery.deploymentTransaction().wait(5);

  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [minEntryFee, maxParticipants, lotteryDuration],
    });
    console.log("Contract verified on Etherscan");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});