const hre = require("hardhat");

async function main() {
  const DiscordLogger = await ethers.getContractFactory("DiscordLogger");
  const discordLogger = await DiscordLogger.deploy();

  await discordLogger.deployed();

  console.log("DiscordLogger déployé à l'adresse :", discordLogger.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });