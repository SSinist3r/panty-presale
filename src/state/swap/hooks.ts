import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount, Trade } from '@pancakeswap-libs/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGetPANTYAmount, useGetTokenAmount } from 'hooks/useGetSaleData'
import { useCurrency } from 'hooks/Tokens'
import useTokenBalance from 'hooks/useTokenBalance'
import BigNumber from 'bignumber.js'

import { useActiveWeb3React } from '../../hooks'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'
import { BIG_TEN, GOVERN_TOKEN } from '../../constants'


export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>((state) => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency instanceof Token ? currency.address : currency === ETHER ? 'BNB' : '',
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: Currency): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals ?? 18).toString()
    
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.info(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

const BAD_RECIPIENT_ADDRESSES: string[] = [
  '0xBCfCcbde45cE874adCB698cC183deBcF17952812', // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a', // v2 router 01
  '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F', // v2 router 02
]

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: Trade, checksummedAddress: string): boolean {
  return (
    trade.route.path.some((token) => token.address === checksummedAddress) ||
    trade.route.pairs.some((pair) => pair.liquidityToken.address === checksummedAddress)
  )
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: BigNumber }
  parsedAmounts: { [field in Field]?: BigNumber }
  inputError?: string
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId }
  } = useSwapState()
    
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
 
  const inputTokenBalance = useTokenBalance(inputCurrencyId || '')
  const outputTokenBalance = useTokenBalance(outputCurrencyId || '')

  // Div input & output balance to decimals
  const inputParseAmount = inputTokenBalance.div(BIG_TEN.pow(inputCurrency.decimals))
  const outputParseAmount = outputTokenBalance.div(BIG_TEN.pow(outputCurrency.decimals))

  const currencyBalances = {
    [Field.INPUT]: inputParseAmount,
    [Field.OUTPUT]: outputParseAmount,
  }
  
  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  }
  
  const pantyAmount = useGetPANTYAmount(typedValue, inputCurrency?.symbol || "BNB")
  const tokenAmount = useGetTokenAmount(typedValue, inputCurrency?.symbol || "BNB")

  const parsedAmounts: { [field in Field]?: BigNumber } = {
    [Field.INPUT]: independentField === Field.INPUT ? new BigNumber(typedValue) : new BigNumber(tokenAmount || '0'),
    [Field.OUTPUT]: independentField === Field.INPUT ? new BigNumber(pantyAmount || '0') : new BigNumber(typedValue) 
  }
  if (parsedAmounts[Field.INPUT]?.isNaN()) parsedAmounts[Field.INPUT] = new BigNumber(0)
  if (parsedAmounts[Field.OUTPUT]?.isNaN()) parsedAmounts[Field.OUTPUT] = new BigNumber(0)

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.INPUT] || parsedAmounts[Field.INPUT]?.isZero() || !parsedAmounts[Field.OUTPUT] || parsedAmounts[Field.OUTPUT]?.isZero()) {
    inputError = inputError ?? 'Enter an amount'
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    parsedAmounts[Field.INPUT]
  ]
  
  if (balanceIn && amountIn && balanceIn.lt(amountIn)) {
    inputError = `Insufficient ${inputCurrency.symbol} balance`
  }

  return {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError,
  }
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === 'BNB') return 'BNB'
    if (valid === false) return 'BNB'
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  // eslint-disable-next-line no-restricted-globals
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  const inputCurrencyId = 'BNB'
  const outputCurrencyId = GOVERN_TOKEN

  let inputCurrency = parseCurrencyFromURLParameter(inputCurrencyId)
  let outputCurrency = parseCurrencyFromURLParameter(outputCurrencyId)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient)
  
  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined }
  | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs)

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: parsed.recipient,
      })
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
