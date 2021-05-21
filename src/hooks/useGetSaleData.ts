import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import BigNumber from 'bignumber.js'
import { AbiItem } from 'web3-utils'
import { getWeb3NoAccount } from 'utils/web3'
import presaleABI from 'constants/abis/presale.json'

import Web3 from 'web3'

import { getPresaleContractAddress } from 'utils/addressHelpers'
import { DEFAULT_TOKEN_DECIMAL } from '../constants'
import { usePresaleContract } from './useContract'

const web3 = getWeb3NoAccount()
const presaleContract = new web3.eth.Contract(presaleABI as unknown as AbiItem, getPresaleContractAddress())

// Get PANTY amount from the 'tokenAmount' of 'tokenName'
export const useGetPANTYAmount = (tokenAmount: string, tokenName: string) => {

  const [data, setData] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenAmountInDecimal = new BigNumber(tokenAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)
        const pantyAmount = await presaleContract.methods.calculatePANTY(tokenAmountInDecimal.toString(), tokenName).call()
        const pantyAmountInBigNumber = new BigNumber(pantyAmount)
        if (pantyAmountInBigNumber.isNaN()) {
          setData("0")
        } else {
          setData(pantyAmountInBigNumber.div(DEFAULT_TOKEN_DECIMAL).toString())
        }
      } catch (error) {
        console.error('Unable to fetch PANTY amount:', error)
      }
    }

    fetchData()
  }, [setData, tokenAmount, tokenName])

  return data
}

// Get token amount of 'tokenName' from the 'pantyAmount' of PANTY
export const useGetTokenAmount = (pantyAmount: string, tokenName: string) => {

  const [data, setData] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const payAmountInDecimal = new BigNumber(pantyAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)
        const tokenAmount = await presaleContract.methods.calculateSpendingToken(payAmountInDecimal.toString(), tokenName).call()
        const tokenAmountInBigNumber = new BigNumber(tokenAmount)
        if (tokenAmountInBigNumber.isNaN()) {
          setData("0")
        } else {
          setData(tokenAmountInBigNumber.div(DEFAULT_TOKEN_DECIMAL).toString())
        }
      } catch (error) {
        console.error('Unable to fetch token amount:', error)
      }
    }

    fetchData()
  }, [setData, pantyAmount, tokenName])

  return data
}

// Purchase PANTY

const purchaseWithBNB = async (pantyAmount, tokenAmount, account) => {
  return presaleContract.methods.buyWithBNB(pantyAmount)
    .send({ from: account, gas: 200000, value: tokenAmount })
    .on('transactionHash', (tx) => {
      return tx.transactionHash
    })
}

const purchaseWithyPANTY = async (pantyAmount, account) => {
  return presaleContract.methods.buyWithyPANTY(pantyAmount)
    .send({ from: account })
    .on('transactionHash', (tx) => {
      return tx.transactionHash
    })
}

export const usePANTYPurchase = () => {
  const { account } = useActiveWeb3React()

  const handlePurchase = useCallback(
    async (pantyAmount: string, tokenAmount: string, tokenName?: string) => {
      const pantyAmountInDecimal = new BigNumber(pantyAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)
      const tokenAmountInDecimal = new BigNumber(tokenAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)

      if (tokenName === "BNB") {
        try {
          await purchaseWithBNB(pantyAmountInDecimal, tokenAmountInDecimal, account);
        } catch (error) {
          console.error('purchaseWithBNB', pantyAmountInDecimal, tokenAmountInDecimal, account, error)
        }
      } else {
        await purchaseWithyPANTY(pantyAmountInDecimal, account);
      }
    },
    [account],
  )

  return { onPurchase: handlePurchase }
}
