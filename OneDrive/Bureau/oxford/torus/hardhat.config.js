require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");


module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: process.env.ALCHEMY_URL,
      accounts:[process.env.PRIVATE_KEY],
    }
  }
};
