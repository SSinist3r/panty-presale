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
import { useGetSaleInformation, usePANTYPurchase } from 'hooks/useGetSaleData'
import { Field } from 'state/swap/actions'
import { tryParseAmount, useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import BigNumber from 'bignumber.js'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import useI18n from 'hooks/useI18n'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { getPresaleContractAddress } from 'utils/addressHelpers'
import PageHeader from 'components/PageHeader'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { BIG_ZERO, BIG_TEN } from 'utils/bigNumber'
import CountDownTimer from 'components/CountDownTimer'

import AppBody from '../AppBody'

const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const Presale = () => {
  useDefaultsFromURLSearch()
  const TranslateString = useI18n()
  const { account } = useActiveWeb3React()

  const { startDate, endDate, totalSold, totalToSell } = useGetSaleInformation()

  // swap state
  const { independentField, typedValue } = useSwapState()
  const { currencyBalances, parsedAmounts, currencies, inputError: swapInputError } = useDerivedSwapInfo()

  const inputCurrencyAmount = tryParseAmount(
    parsedAmounts[Field.INPUT]?.multipliedBy(BIG_TEN.pow(currencies[Field.INPUT]?.decimals ?? 18)).toString(),
    currencies[Field.INPUT])
  const [approvalInput, approveInputCallback] = useApproveCallback(inputCurrencyAmount, getPresaleContractAddress())

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
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

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toString() || '',
  }

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const maxAmountInput: BigNumber = currencyBalances[Field.INPUT] ?? BIG_ZERO
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.isGreaterThanOrEqualTo(maxAmountInput))

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection, setApprovalSubmitted]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toFixed(6))
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  const { onPurchase } = usePANTYPurchase()

  return (
    <Container>
      <Flex mb="7px" alignItems="center" flexDirection="column">
        <CountDownTimer startEpoch={Number(startDate)} endEpoch={Number(endDate)} />
      </Flex>
      <AppBody>
        <Wrapper id="swap-page">
          <PageHeader
            title={TranslateString(8, 'Purchase')}
            tag1="Fixed Price"
            description1={TranslateString(1192, '1 BNB = 4800 PANTY')}
            tag2="Buyout progress"
            description2={TranslateString(1192, `${totalToSell} PANTY / ${totalSold} PANTY`)}
          />
          <CardBody>
            <AutoColumn gap="md">
              <CurrencyInputPanel
                label={TranslateString(76, 'Pay With')}
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={!atMaxAmountInput}
                currency={currencies[Field.INPUT]}
                currencyAmount={currencyBalances[Field.INPUT]}
                disableCurrencySelect
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between">
                <AutoRow justify='center' style={{ padding: '0 1rem' }}>
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
                currencyAmount={currencyBalances[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                id="swap-currency-output"
              />
            </AutoColumn>
            <BottomGrouping>

              {!account ? (
                <ConnectWalletButton width="100%" />
              ) : swapInputError ? (
                <Button
                  id="swap-button"
                  disabled
                  variant='primary'
                  width="100%"
                >
                  {swapInputError}
                </Button>
              ) : approvalInput !== ApprovalState.APPROVED ? (
                <Button
                  onClick={approveInputCallback}
                  id="approve-button"
                  disabled={!isValid || approvalInput === ApprovalState.PENDING}
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
                    onPurchase(formattedAmounts[Field.OUTPUT].toString(),
                      formattedAmounts[Field.INPUT].toString() || '', currencies[Field.INPUT]?.symbol)
                      .then(tx => {
                        console.log(tx)
                        onUserInput(Field.INPUT, '0')
                      });
                  }}
                  id="swap-button"
                  disabled={!isValid}
                  variant='primary'
                  width="100%"
                >
                  {swapInputError
                    ? `${swapInputError}`
                    : `Purchase`}
                </Button>
              )}
            </BottomGrouping>
          </CardBody>
        </Wrapper>
      </AppBody>
    </Container>
  )
}

export default Presale
