import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveWeb3React } from 'hooks'
import BigNumber from 'bignumber.js'
import { ChainId } from '@pancakeswap-libs/sdk'
import { getPresaleContract } from 'utils/contractHelpers'
import { updateBlockNumber } from 'state/application/actions'
import { DEFAULT_TOKEN_DECIMAL } from '../constants'
import useWeb3 from './useWeb3'
import { AppDispatch } from '../state'


// Get PANTY amount from the 'tokenAmount' of 'tokenName'
export const useGetPANTYAmount = (tokenAmount: string, tokenName: string) => {

  const [data, setData] = useState<string | undefined>(undefined)
  const web3 = useWeb3()
  const presaleContract = getPresaleContract(web3)

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
  }, [setData, tokenAmount, tokenName, presaleContract])

  return data
}

// Get token amount of 'tokenName' from the 'pantyAmount' of PANTY
export const useGetTokenAmount = (pantyAmount: string, tokenName: string) => {

  const [data, setData] = useState<string | undefined>(undefined)
  const web3 = useWeb3()
  const presaleContract = getPresaleContract(web3)

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
  }, [setData, pantyAmount, tokenName, presaleContract])

  return data
}

// Purchase PANTY

const purchaseWithBNB = async (pantyAmount, tokenAmount, account, presaleContract) => {
  return presaleContract.methods.buyWithBNB(pantyAmount)
    .send({ from: account, gas: 200000, value: tokenAmount })
    .on('transactionHash', (tx) => {
      return tx.transactionHash
    })
}

const purchaseWithyPANTY = async (pantyAmount, account, presaleContract) => {
  return presaleContract.methods.buyWithyPANTY(pantyAmount)
    .send({ from: account })
    .on('transactionHash', (tx) => {
      return tx.transactionHash
    })
}

export const usePANTYPurchase = () => {
  const { account, chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  const web3 = useWeb3()
  const presaleContract = getPresaleContract(web3)

  const handlePurchase = useCallback(

    async (pantyAmount: string, tokenAmount: string, tokenName?: string) => {
      const pantyAmountInDecimal = new BigNumber(pantyAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)
      const tokenAmountInDecimal = new BigNumber(tokenAmount || '0').multipliedBy(DEFAULT_TOKEN_DECIMAL).toFixed(0)

      if (tokenName === "BNB") {
        try {
          const txHash = await purchaseWithBNB(pantyAmountInDecimal, tokenAmountInDecimal, account, presaleContract);

          dispatch(updateBlockNumber({ chainId: chainId || ChainId.MAINNET, blockNumber: parseInt(txHash.blockNumber) }))
          return txHash
        } catch (error) {
          console.error('purchaseWithBNB', pantyAmountInDecimal, tokenAmountInDecimal, account, error)
          return ''
        }
      } else {
        try {
          const txHash = await purchaseWithyPANTY(pantyAmountInDecimal, account, presaleContract);
          dispatch(updateBlockNumber({ chainId: chainId || ChainId.MAINNET, blockNumber: parseInt(txHash.blockNumber) }))
          return txHash
        } catch (error) {
          console.error('purchaseWithyPANTY', pantyAmountInDecimal, tokenAmountInDecimal, account, error)
          return ''
        }
      }
    },
    [account, presaleContract, dispatch, chainId],
  )

  return { onPurchase: handlePurchase }
}
