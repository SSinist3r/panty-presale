import { PRESALE_CONTRACT_ADDRESS } from "../constants"

interface Address {
  97?: string
  56: string
}

export const getAddress = (address: Address): string => {
  const mainNetChainId = 56
  const chainId = process.env.REACT_APP_CHAIN_ID || mainNetChainId
  return address[chainId] ? address[chainId] : address[mainNetChainId]
}

export const getPresaleContractAddress = () => {
  return getAddress(PRESALE_CONTRACT_ADDRESS)
}
