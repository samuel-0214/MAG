import { Chain } from '@wagmi/core/chains';

export enum NetworkType {
  EVM = 'evm',
  COSMOS = 'cosmos',
  TRON = 'tron',
  NEAR = 'near',
}

export type ChainData = Omit<Chain, 'id'> & { id: string | number; type?: NetworkType };

export const CHAIN_IDS = {
  // evm
  ethereum: '1',
  polygon: '137',
  arbitrum: '42161',
  optimism: '10',
  zksync: '324',
  avalanche: '43114',
  binance: '56',
  polygon_zkevm: '1101',
  manta: '169',
  scroll: '534352',
  mantle: '5000',
  base: '8453',
  linea: '59144',
  blast: '81457',
  xlayer: '196',

  // cosmos

  // tron
  tron: '0x2b6653dc',

  // near

  // testnets
  goerli: '5',
  fuji: '43113',
  mumbai: '80001',
  scrollSepolia: '534351',
  sepolia: '11155111',
} as const;

export type Chains = keyof typeof CHAIN_IDS;
export type ChainIds = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

export const CHAINS: Record<ChainIds, Chains> = {
  [CHAIN_IDS.ethereum]: 'ethereum',
  [CHAIN_IDS.polygon]: 'polygon',
  [CHAIN_IDS.arbitrum]: 'arbitrum',
  [CHAIN_IDS.optimism]: 'optimism',
  [CHAIN_IDS.zksync]: 'zksync',
  [CHAIN_IDS.avalanche]: 'avalanche',
  [CHAIN_IDS.binance]: 'binance',
  [CHAIN_IDS.polygon_zkevm]: 'polygon_zkevm',
  [CHAIN_IDS.manta]: 'manta',
  [CHAIN_IDS.scroll]: 'scroll',
  [CHAIN_IDS.mantle]: 'mantle',
  [CHAIN_IDS.base]: 'base',
  [CHAIN_IDS.linea]: 'linea',
  [CHAIN_IDS.blast]: 'blast',
  [CHAIN_IDS.xlayer]: 'xlayer',

  // tron
  [CHAIN_IDS.tron]: 'tron',

  // testnets
  5: 'goerli',
  43113: 'fuji',
  80001: 'mumbai',
  534351: 'scrollSepolia',
  11155111: 'sepolia',
} as const;
