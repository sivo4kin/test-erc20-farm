import { ethers } from "ethers"

import stores from '../stores'

export default function () {
  // const account = stores((state) => state.account)
  // const getTokenBalance = stores((state) => state.getTokenBalance)
  const stake = stores((state) => state.stake)
  const unstake = stores((state) => state.unstake)
  const withdrawYield = stores((state) => state.withdrawYield)



  const stakeonClick = () => {
    const pmt = prompt('stake amount')
    if (!pmt) return
    stake(pmt)
  }

  const unstakeOnClick = () => {
    const pmt = prompt('unstake amount')
    if (!pmt) return
    unstake(pmt)
  }


  const withdrawYieldOnClick = () => {
    withdrawYield()
  }



  return (
    <div className='grid flex justifyContent center'>
      <br></br>
      <br></br>
      <Info />

      <br></br>


       <br></br>
      <div>
        <button className='btn btn-sm' onClick={withdrawYieldOnClick}>WithdrawYield</button>
      </div>
      <br></br>
      <div>
        <button className='btn btn-sm' onClick={unstakeOnClick}>UnStake</button>
      </div>
      <br></br>
      <div>
        <button className='btn btn-sm' onClick={stakeonClick}>Stake</button>
      </div>
    </div>

  )
}

function Info () {
  const account = stores((state) => state.account)
  const balance = stores((state) => state.balance)
  const getBalance = stores((state) => state.getBalance)
  const getTokenBalance = stores((state) => state.getTokenBalance)

  useEffect(() => {
    if (!account) return
    getBalance(account)
  }, [account])

  return (
    <div>
      <div>balance: {balance}</div>
      <div>tokenBalance: {getTokenBalance}</div>

    </div>

  )
}



