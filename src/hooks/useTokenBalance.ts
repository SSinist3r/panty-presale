import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import { getBep20Contract } from 'utils/contractHelpers'
import { BIG_ZERO } from 'utils/bigNumber'
import useWeb3 from './useWeb3'
import useRefresh from './useRefresh'
import useLastUpdated from './useLastUpdated'
import { useAllTokens } from './Tokens'

const useTokenBalance = (tokenAddress: string) => {
  const [balance, setBalance] = useState(BIG_ZERO)
  const { account } = useWeb3React()
  const web3 = useWeb3()
  const { fastRefresh } = useRefresh()

  useEffect(() => {
    const fetchBalance = async () => {
      if (tokenAddress && tokenAddress.toUpperCase() !== "BNB" && tokenAddress.toUpperCase() !== "WBNB") {
        const contract = getBep20Contract(tokenAddress, web3)
        const res = await contract.methods.balanceOf(account).call()
        setBalance(new BigNumber(res))
        console.log("res ", res)
      } else {
        const walletBalance = account ? await web3.eth.getBalance(account) : 0
        setBalance(new BigNumber(walletBalance))
        console.log("walletBalance ", walletBalance)
      }
    }

    if (account) {
      fetchBalance()
    }
  }, [account, tokenAddress, web3, fastRefresh])

  return balance
}

export const useGetBnbBalance = () => {
  const [balance, setBalance] = useState(BIG_ZERO)
  const { account } = useWeb3React()
  const { lastUpdated, setLastUpdated } = useLastUpdated()
  const web3 = useWeb3()

  useEffect(() => {
    const fetchBalance = async () => {
      const walletBalance = account ? await web3.eth.getBalance(account) : 0
      setBalance(new BigNumber(walletBalance))
    }

    if (account) {
      fetchBalance()
    }
  }, [account, web3, lastUpdated, setBalance])

  return { balance, refresh: setLastUpdated }
}

export function useBalanceFromCurrencyId(currencyId: string | undefined): BigNumber {
  const allTokens = useAllTokens()
  const keys = Object.keys(allTokens).filter(key => allTokens[key].address === currencyId)
  
  const tokenAddress = keys.length > 0 ? allTokens[keys[0]].address : ''
  const tokenDecimals = keys.length > 0 ? allTokens[keys[0]].decimals : 18
  const selectedCurrencyBalance = useTokenBalance(tokenAddress)
  return selectedCurrencyBalance.div(new BigNumber(10).pow(tokenDecimals))
}

export function useBalanceFromCurrencySymbol(currencySymbol: string | undefined): BigNumber {
  const allTokens = useAllTokens()
  const keys = Object.keys(allTokens).filter(key => allTokens[key].symbol === currencySymbol)

  const tokenAddress = keys.length > 0 ? allTokens[keys[0]].address : ''
  const tokenDecimals = keys.length > 0 ? allTokens[keys[0]].decimals : 18
  const selectedCurrencyBalance = useTokenBalance(tokenAddress)
  return selectedCurrencyBalance.div(new BigNumber(10).pow(tokenDecimals))
}

export default useTokenBalance
