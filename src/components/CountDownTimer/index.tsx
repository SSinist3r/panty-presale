import React, { useState, useCallback, useEffect } from 'react'
import { Currency, Pair } from '@pancakeswap-libs/sdk'
import { Button, ChevronDownIcon, Flex, Text } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import useRefresh from '../../hooks/useRefresh'

const RowContainer = styled.div`
color: ${({theme}) => (theme.isDark ? 'hsl(0, 0%, 100%)' : 'hsl(0, 0%, 6%)')};
  display: flex;
  justify-content: center;
  gap: 20px;
`

const Heading = styled.h1`
  color: ${({theme}) => (theme.isDark ? 'hsl(0, 0%, 100%)' : 'hsl(0, 0%, 6%)')};
  text-align: center;
  font-size: 2.6rem;
  letter-spacing: 3px;
  font-weight: 500;
  margin-bottom: 20px;
  text-transform: uppercase;
`

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
`
const ItemValue = styled.div`
  color: hsl(345, 95%, 68%);
  font-size: 48px;
  background: hsl(236, 21%, 26%);;
  padding: 20px 17px;
  border-radius: 10px;
  margin-bottom: 15px;
`
const ItemLabel = styled.p`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
`
const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
`
const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`
interface CountDownTimerProps {
  startEpoch: number
  endEpoch: number
}

const CountDownTimer = ({
  startEpoch = 1621934483,
  endEpoch = 1621934483,
}: CountDownTimerProps) => {

  const [months, setMonths] = useState("-")
  const [days, setDays] = useState("-")
  const [hours, setHours] = useState("-")
  const [minutes, setMinutes] = useState("-")
  const [seconds, setSeconds] = useState("-")
  const [title, setTitle] = useState("")

  const { fastRefresh } = useRefresh()

  useEffect(() => {
    const now = new Date().getTime()
    let distance = endEpoch * 1000 - now
    if (now < startEpoch * 1000) {
      distance = startEpoch * 1000 - now
      setTitle("Presale starts in")
    } else if (now > endEpoch * 1000) {
      setTitle("Presale ended")
      setMonths("-")
      setDays("-")
      setHours("-")
      setMinutes("-")
      setSeconds("-")
      return
    } else {
      setTitle("Presale ends in")
    }

    const nmonths = Math.floor(distance / (1000 * 60 * 60 * 24 * 30));
    const ndays = Math.floor(
      (distance % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)
    );
    const nhours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const nminutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const nseconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    setMonths(nmonths.toString())
    setDays(ndays.toString())
    setHours(nhours.toString())
    setMinutes(nminutes.toString())
    setSeconds(nseconds.toString())
  }, [startEpoch, endEpoch, fastRefresh])

  return (
    <Flex flexDirection="column" mb="20px">
      <Heading>{title}</Heading>
      <RowContainer>
        <Item>
          <ItemValue id="months">{months}</ItemValue>
          <ItemLabel>Months</ItemLabel>
        </Item>
        <Item>
          <ItemValue id="days">{days}</ItemValue>
          <ItemLabel>Days</ItemLabel>
        </Item>
        <Item>
          <ItemValue id="hours">{hours}</ItemValue>
          <ItemLabel>hours</ItemLabel>
        </Item>
        <Item>
          <ItemValue id="minutes">{minutes}</ItemValue>
          <ItemLabel>Minutes</ItemLabel>
        </Item>
        <Item>
          <ItemValue id="seconds">{seconds}</ItemValue>
          <ItemLabel>Seconds</ItemLabel>
        </Item>
      </RowContainer>
    </Flex>
  )
}

export default CountDownTimer