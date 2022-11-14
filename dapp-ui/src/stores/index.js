import { ethers } from 'ethers'
import create from 'zustand'

const ethereum = window.ethereum

const stores = create((set) => ({
  init: false,
  account: null,

  str: null,
  balance: 0,

  async connect () {
    ethereum.request({ method: 'eth_requestAccounts' })
  },

  async getStr () {
    set({ str: await dappContract.getStr() })
  },

  async setStr (str) {
    await dappContract.setStr(str)
  },

  async getBalance (account) {
     set({ balance: ethers.utils.formatEther(await provider.getBalance(account)) })
  },

  async getTokenBalance (account) {
    set({ tokenBalance: ethers.utils.formatEther(await tokenContract.balanceOf(account)) })
  },

  async stake (amount) {
    try {
      let signer = provider.getSigner()
      amount = ethers.utils.parseEther(amount)
      let tx = await tokenContract.connect(signer).approve(farmingContract.address, amount)
      provider.waitForTransaction(tx.hash)
        .then(async() => {
          tx = await farmingContract.connect(signer).stake(amount)
        })
      return tx
    } catch (error) {
      alert(error)
    }
  },




  async unstake (amount) {
    await farmingContract.unstake(amount)
  },

  async withdrawYield () {
    let signer = provider.getSigner()
    let tx = await farmingContract.connect(signer).withdrawYield()
    return tx
  },

}))

// A Provider (in ethers) is a class which provides an abstraction for a connection to the Ethereum Network. It provides read-only access to the Blockchain and its status.

// The "any" network will allow spontaneous network changes
const provider = new ethers.providers.Web3Provider(ethereum, 'any')

// A Signer is a class which (usually) in some way directly or indirectly has access to a private key, which can sign messages and transactions to authorize the network to charge your account ether to perform operations.

const signer = provider.getSigner()

// provider events

// Force page refreshes on network changes
provider.on('network', (newNetwork, oldNetwork) => {
  // When a Provider makes its initial connection, it emits a "network"
  // event with a null oldNetwork along with the newNetwork. So, if the
  // oldNetwork exists, it represents a changing network
  if (oldNetwork) {
    window.location.reload()
  }
})

ethereum.on('accountsChanged', reloadPage)
ethereum.on('chainChanged', reloadPage)

// A Contract is an abstraction which represents a connection to a specific contract on the Ethereum Network, so that applications can use it like a normal JavaScript object.

let dappContract, farmingContract, tokenContract

Promise.all([
  fetch('./static/contracts.json').then((resp) => resp.json()),
  fetch('./static/abi/Dapp.json').then((resp) => resp.json()),
  fetch('./static/abi/Farming.json').then((resp) => resp.json()),
  fetch('./static/abi/Token.json').then((resp) => resp.json()),
]).then(init)

async function init ([
  ContractAddrs,
  DappContract,
  FarmigContract,
  TokenContract
]) {
  // init contracts
  dappContract = new ethers.Contract(ContractAddrs.DappAddr, DappContract.abi, signer)
  farmingContract = new ethers.Contract(ContractAddrs.FarmingAddr, FarmigContract.abi, signer)
  tokenContract = new ethers.Contract(ContractAddrs.TokenAddr, TokenContract.abi, signer)

  // dappContract = new ethers.Contract(ContractAddrs.DappAddr, DappContract.abi, signer)
  // contract events
  dappContract.on('changeStr', (str) => {
    console.log('changeStr', str)
    stores.setState({ str })
  })

  stores.setState({ init: true })

  ethereum.request({ method: 'eth_accounts' }).then(setAccount)
}

function reloadPage () {
  window.location.reload()
}

function setAccount ([account]) {
  if (!account) return
  stores.setState({ account })
}

export default stores
