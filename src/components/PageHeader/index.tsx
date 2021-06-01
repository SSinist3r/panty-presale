import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { Heading, IconButton, Text, Flex, useModal, TuneIcon, HistoryIcon } from '@pancakeswap-libs/uikit'
import useI18n from 'hooks/useI18n'
import SettingsModal from './SettingsModal'
import RecentTransactionsModal from './RecentTransactionsModal'

interface PageHeaderProps {
  title: ReactNode
  tag1?: ReactNode,
  description1?: ReactNode,
  tag2?: ReactNode,
  description2?: ReactNode
  children?: ReactNode
}

const StyledPageHeader = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  padding: 24px;
`

const Details = styled.div`
  flex: 1;
`

const PageHeader = ({ title, tag1, description1, tag2, description2, children }: PageHeaderProps) => {
  const TranslateString = useI18n()
  const [onPresentSettings] = useModal(<SettingsModal translateString={TranslateString} />)
  const [onPresentRecentTransactions] = useModal(<RecentTransactionsModal translateString={TranslateString} />)

  return (
    <StyledPageHeader>
      <Flex alignItems="center">
        <Details>
          {/* <Heading mb="8px">{title}</Heading> */}
          {description1 && tag1 && (<>
            <Text color="textSubtle" fontSize="14px" mt="5px">
              {tag1}
            </Text>
            <Text color="text" fontSize="17px">
              {description1}
            </Text>
          </>
          )}
          {description2 && tag2 && (
            <>
              <Text color="textSubtle" fontSize="14px" mt="5px">
                {tag2}
              </Text>
              <Text color="text" fontSize="17px">
                {description2}
              </Text>
            </>
          )}
        </Details>
        {/* <IconButton variant="text" onClick={onPresentSettings} title={TranslateString(1200, 'Settings')}>
          <TuneIcon width="24px" color="currentColor" />
        </IconButton> */}
        {/* <IconButton
          variant="text"
          onClick={onPresentRecentTransactions}
          title={TranslateString(1202, 'Recent transactions')}
        >
          <HistoryIcon width="24px" color="currentColor" />
        </IconButton> */}
      </Flex>
      {children && <Text mt="16px">{children}</Text>}
    </StyledPageHeader>
  )
}

export default PageHeader
