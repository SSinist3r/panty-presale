import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import web3NoAccount from 'utils/web3'

// ABI
import presaleAbi from 'constants/abis/presale.json'
import bep20Abi from 'constants/abis/erc20.json'
import { PRESALE_CONTRACT_ADDRESS } from '../constants'

export interface Address {
  97?: string
  56: string
}

const getContract = (abi: any, address: string, web3?: Web3) => {
  const _web3 = web3 ?? web3NoAccount
  return new _web3.eth.Contract(abi as unknown as AbiItem, address)
}

export const getPresaleContract = (web3?: Web3) => {
  const mainNetChainId = 56
  const chainId = process.env.REACT_APP_CHAIN_ID || mainNetChainId

  return getContract(presaleAbi, PRESALE_CONTRACT_ADDRESS[chainId] ? PRESALE_CONTRACT_ADDRESS[chainId] : PRESALE_CONTRACT_ADDRESS[mainNetChainId], web3)
}

export const getBep20Contract = (address: string, web3?: Web3) => {
  return getContract(bep20Abi, address, web3)
}