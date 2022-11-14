const { expect } = require('chai')
const { ethers } = require('hardhat')
const {BN } = require('@openzeppelin/test-helpers')

async function timeTravelFor(secs) {
  await ethers.provider.send("evm_increaseTime", [secs]);
  await ethers.provider.send("evm_mine");
}

describe('Farming contract', function () {
  let Token
  let token
  let Farming
  let farmingContract
  let owner
  let user
  let tokenUserConnect
  let farmingUserInstance
  const travelForHour = 3600
  const travelForDay = 86400
  const sum = '1000'
  const deposit = '100'
  const oneUnstake = '10'
  const owner_res = sum - deposit
  before(async () => {
    [owner, user] = await ethers.getSigners()
    // owner = await ethers.getSigners()
    Token = await ethers.getContractFactory('Token')
    token = await Token.deploy()
    await token.mint(owner.address, sum)
    // await token.mint(user.address, sum)

    // await token.allowance(owner.address, token.address)
    Farming = await ethers.getContractFactory('Farming')
    farmingContract = await Farming.deploy(token.address)
    await token.approve(owner.address, sum)

    await token.transfer(user.address, deposit)

    tokenUserConnect = await token.connect(user)


    // await token.approve(user.address, deposit)
    // await token.approve(farmingContract.address, deposit)
    await tokenUserConnect.approve(user.address, deposit)
    await tokenUserConnect.approve(farmingContract.address, deposit)

  })

  beforeEach(async () => {
    farmingUserInstance = await farmingContract.connect(user)
  })

  it('test token name', async function () {
    expect(await token.name()).equals('MTCToken')
  })

  it('test adresses', async function () {
    console.log("user.address", user.address)
    console.log("owner.address", owner.address)
    expect(user.address).not.equals(owner.address)
  })


  it('test owner balance', async function () {

    console.log('owner_res', owner_res)
    expect(await token.balanceOf(owner.address)).equals(owner_res)
  })

  it('test  allowance', async function () {
    expect(await token.allowance(owner.address, owner.address)).equals(sum)
  })

  it('You cannot stake zero tokens', async function () {
    await expect(farmingUserInstance.stake(0)).to.be.revertedWith('amount zero')
  })

  it('test  send to user', async function () {
    expect(await token.balanceOf(user.address)).equals(deposit)
    // expect(await token.allowance(owner.address, user.address)).equals(deposit)
    expect(await token.allowance(user.address, user.address)).equals(deposit)
  })

  it('check token address', async function () {
    tAddr = await farmingContract.getToken()
    expect(tAddr).equals(token.address)
    const farmingUserConnect = await farmingContract.connect(user)
    tAddr2 = await farmingUserConnect.getToken()
    expect(tAddr2).equals(token.address)
  })

  it(`test stake ${deposit} tokens`, async function () {
    console.log('user.address :', user.address)
    const tx = await farmingUserInstance.stake(deposit)
    await expect(tx).to.emit(farmingContract, 'Stake').withArgs(user.address, deposit)
  })

  it(`deposited less then one day ago`, async function () {
    console.log('user.address :', user.address)
    await timeTravelFor(travelForHour)
    await expect(farmingUserInstance.unstake(deposit)).to.be.revertedWith('deposited less then one day ago')
  })

  it(`unstake ${oneUnstake} tokens after 1 day `, async function () {
    console.log('user.address :', user.address)
    await timeTravelFor(travelForDay)
    const tx = await farmingUserInstance.unstake(oneUnstake)
    await expect(tx).to.emit(farmingContract, 'Unstake').withArgs(user.address, oneUnstake)
    // const bal = await farmingContract.stakingBalance()
    // console.log(bal)
    // const yield = await farmingContract.calculateYieldTotal(user.address)
    // console.log(yield)
  })

  it(`can not unstake more often then once a hour`, async function () {
    await expect(farmingUserInstance.unstake(deposit)).to.be.revertedWith('allready withdraw during last hour')
  })

  it(`test calculateYieldTotal`, async function () {
    await timeTravelFor(travelForHour)
    const resultYeld = (deposit - oneUnstake) * 0.1 * 26
    const tx = await farmingContract.calculateYieldTotal(user.address)
    await expect(tx).to.be.equal(resultYeld)
    const ownerYield = await farmingContract.calculateYieldTotal(user.address)
    await expect(ownerYield).to.be.equal(resultYeld)
    await expect(owner.address).to.be.not.equal(user.address)

    console.log(resultYeld)
  })

  it(`test calculateYieldTotal after 1 hour 10 % from deposit`, async function () {
    await timeTravelFor(travelForHour)
    const resultYeld = (deposit - oneUnstake) * 0.1 * 27
    const tx = await farmingContract.calculateYieldTotal(user.address)
    await expect(tx).to.be.equal(resultYeld)
    console.log(resultYeld)
  })

  it(`withdrawYield after 1 day and 1 hour equals deposit x 0.1 x 25`, async function () {
    // await timeTravelFor(travelForDay)
    // await timeTravelFor(travelForDay)
    console.log('user.address :', user.address)
    // const resultYeld = (deposit - oneUnstake) * 0.1 * 26
    // const resultYeld = await farmingContract.calculateYieldTotal(user.address)
    console.log('owner_res:', owner_res)
    // console.log('resultYeld', resultYeld)
    const resultYeld = BN((deposit - oneUnstake) * 0.1 * 26).add(BN(deposit))

    // const tx = await farmingUserInstance.calculateYieldTotal(user.address)
    // await expect(tx).to.be.equal(123)
    const tx = await farmingUserInstance.withdrawYield()
    await expect(tx).to.emit(farmingUserInstance, 'YieldWithdraw').withArgs(user.address, resultYeld)
  })

  it(`not a staker after withdrawYielded`, async function () {
    console.log('user.address :', user.address)
    const resultYeld = deposit * 0.1 * 25
    console.log('owner_res:', owner_res)
    console.log('resultYeld', resultYeld)
    await expect(farmingUserInstance.withdrawYield()).to.be.revertedWith('not a staker')
  })
})
