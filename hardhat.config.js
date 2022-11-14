require('@nomiclabs/hardhat-waffle')

module.exports = {
  solidity: '0.8.9',
  paths: {
    root: './dapp-contract'
  },
  networks: {
    hardhat: {
      // mining: {
      //   auto: false,
      //   interval: [300, 600]
      // },
      chainId: 1337
    }
  }
}
