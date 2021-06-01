import { MenuEntry } from '@pancakeswap-libs/uikit'

const config: MenuEntry[] = [
  // {
  //   label: 'Home',
  //   icon: 'HomeIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/',
  // },
  {
    label: 'Presale',
    icon: 'TicketIcon',
    href: '/',
    status: {
      text: 'OPEN',
      color: 'success',
    },
  },
  // {
  //   label: 'Trade',
  //   icon: 'TradeIcon',
  //   items: [
  //     {
  //       label: 'Exchange',
  //       href: 'https://exchange.yieldpanty.finance/#/swap',
  //     },
  //     {
  //       label: 'Liquidity',
  //       href: 'https://exchange.yieldpanty.finance/#/pool',
  //     },
  //   ],
  // },
  // {
  //   label: 'Virgin Farms',
  //   icon: 'FarmIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/farms',
  // },
  // {
  //   label: 'Simp Pools',
  //   icon: 'PoolIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/pools',
  // },
  // {
  //   label: 'Prediction',
  //   icon: 'PredictionsIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/prediction',
  //   status: {
  //     text: 'BETA',
  //     color: 'warning',
  //   },
  // },
  // {
  //   label: 'Lottery',
  //   icon: 'TicketIcon',
  //   href: 'pantyswap.yieldpanty.finance/lottery',
  //   status: {
  //     text: 'BETA',
  //     color: 'warning',
  //   },
  // },
  // {
  //   label: 'Collectibles',
  //   icon: 'NftIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/nft',
  // },
  // {
  //   label: 'Team Battle',
  //   icon: 'TeamBattleIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/competition',
  // },
  // {
  //   label: 'Teams & Profile',
  //   icon: 'GroupsIcon',
  //   items: [
  //     {
  //       label: 'Leaderboard',
  //       href: 'https://pantyswap.yieldpanty.finance/teams',
  //     },
  //     {
  //       label: 'Task Center',
  //       href: 'https://pantyswap.yieldpanty.finance/profile/tasks',
  //     },
  //     {
  //       label: 'Your Profile',
  //       href: 'https://pantyswap.yieldpanty.finance/profile',
  //     },
  //   ],
  // },
  // {
  //   label: 'Info',
  //   icon: 'InfoIcon',
  //   items: [
  //     {
  //       label: 'Overview',
  //       href: 'https://pancakeswap.info',
  //     },
  //     {
  //       label: 'Tokens',
  //       href: 'https://pancakeswap.info/tokens',
  //     },
  //     {
  //       label: 'Pairs',
  //       href: 'https://pancakeswap.info/pairs',
  //     },
  //     {
  //       label: 'Accounts',
  //       href: 'https://pancakeswap.info/accounts',
  //     },
  //   ],
  // },
  // {
  //   label: 'IFO',
  //   icon: 'IfoIcon',
  //   href: 'https://pantyswap.yieldpanty.finance/ifo',
  // },
  {
    label: 'More',
    icon: 'MoreIcon',
    items: [
      {
        label: 'Contact',
        href: 'mailto:info@yieldpanty.finance',
      },
      // {
      //   label: 'Voting',
      //   href: 'https://voting.pancakeswap.finance',
      // },
      {
        label: 'Github',
        href: 'https://github.com/pantyswap',
      },
      {
        label: 'Docs',
        href: 'https://pantyswap.gitbook.io/pantyswap/',
      },
      // {
      //   label: 'Blog',
      //   href: 'https://pancakeswap.medium.com',
      // },
      {
        label: 'Merch',
        href: 'https://pantyswap-official.creator-spring.com/listing/pantyswap-merchandising',
      },
    ],
  },
]

export default config
