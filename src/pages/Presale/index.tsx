import { CurrencyAmount, JSBI, Token, Trade } from '@pancakeswap-libs/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { CardBody, ArrowDownIcon, Button, IconButton, Text, useModal, Link, Flex } from '@pancakeswap-libs/uikit'
import styled, { ThemeContext } from 'styled-components'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoRow, RowBetween } from 'components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from 'components/swap/styleds'
import Container from 'components/Container'

import { useActiveWeb3React } from 'hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import useI18n from 'hooks/useI18n'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePANTYPurchase } from 'hooks/useGetSaleData'
import { getPresaleContractAddress } from 'utils/addressHelpers'
import PageHeader from 'components/PageHeader'
import ConnectWalletButton from 'components/ConnectWalletButton'

import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'


const Presale = () => {
  const loadedUrlParams = useDefaultsFromURLSearch()
  const TranslateString = useI18n()

  const [disableSwap, setDisableSwap] = useState(false)
  const [hasPoppedModal, setHasPoppedModal] = useState(false)
  const [interruptRedirectCountdown, setInterruptRedirectCountdown] = useState(false)

  const [transactionWarning, setTransactionWarning] = useState<{
    selectedToken: string | null
    purchaseType: string | null
  }>({
    selectedToken: null,
    purchaseType: null,
  })

  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [isExpertMode] = useExpertModeManager()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { currencyBalances, parsedAmounts, currencies, inputError: swapInputError } = useDerivedSwapInfo()

  const [approvalInput, approveInputCallback] = useApproveCallback(parsedAmounts[Field.INPUT], getPresaleContractAddress())
  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toExact() ?? '',
  }

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // This will check to see if the user has selected Syrup or SafeMoon to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForWarning = useCallback(
    (selected: string, purchaseType: string) => {
      if (['SYRUP', 'SAFEMOON'].includes(selected)) {
        setTransactionWarning({
          selectedToken: selected,
          purchaseType,
        })
      }
    },
    [setTransactionWarning]
  )

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setHasPoppedModal(false)
      setInterruptRedirectCountdown(false)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection, setApprovalSubmitted]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      setHasPoppedModal(false)
      setInterruptRedirectCountdown(false)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      if (outputCurrency.symbol === 'SYRUP') {
        checkForWarning(outputCurrency.symbol, 'Buying')
      }
      if (outputCurrency.symbol === 'SAFEMOON') {
        checkForWarning(outputCurrency.symbol, 'Buying')
      }
    },
    [onCurrencySelection, checkForWarning]
  )

  const { onPurchase } = usePANTYPurchase()

  return (
    <Container>
      <AppBody>
        <Wrapper id="swap-page">
          <PageHeader
            title={TranslateString(8, 'Purchase')}
            description={TranslateString(1192, '$PANTY from $yPANTY or $BNB')}
          />
          <CardBody>
            <AutoColumn gap="md">
              <CurrencyInputPanel
                label={TranslateString(76, 'Pay With')}
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={!atMaxAmountInput}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between">
                <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <IconButton
                      variant="tertiary"
                      style={{ borderRadius: '50%' }}
                      scale="sm"
                    >
                      <ArrowDownIcon color="primary" width="24px" />
                    </IconButton>
                  </ArrowWrapper>
                </AutoRow>
              </AutoColumn>
              <CurrencyInputPanel
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                label={TranslateString(80, 'Get')}
                showMaxButton={false}
                disableCurrencySelect
                currency={currencies[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                id="swap-currency-output"
              />
            </AutoColumn>
            <BottomGrouping>

              {!account ? (
                <ConnectWalletButton width="100%" />
              ) : approvalInput !== ApprovalState.APPROVED ? (
                <Button
                  onClick={approveInputCallback}
                  id="approve-button"
                  disabled={disableSwap || !isValid || approvalInput === ApprovalState.PENDING}
                  variant='primary'
                  width="100%"
                >
                  {approvalInput === ApprovalState.PENDING ? (
                    <Dots>Approving {currencies[Field.INPUT]?.symbol}</Dots>
                  ) : (
                    `Approve ${currencies[Field.INPUT]?.symbol}`
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    onPurchase(formattedAmounts[Field.OUTPUT].toString(), formattedAmounts[Field.INPUT].toString(), currencies[Field.INPUT]?.symbol);
                  }}
                  id="swap-button"
                  disabled={disableSwap || !isValid}
                  variant='primary'
                  width="100%"
                >
                  {swapInputError
                    ? `${swapInputError}`
                    : `Purchase`}
                </Button>
              )}

              {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
            </BottomGrouping>
          </CardBody>
        </Wrapper>
      </AppBody>
    </Container>
  )
}

export default Presale
