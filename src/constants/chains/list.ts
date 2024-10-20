import {
  Chain,
  arbitrum,
  avalanche,
  avalancheFuji,
  base,
  bsc,
  goerli,
  linea,
  mainnet,
  manta,
  mantle,
  optimism,
  polygon,
  polygonMumbai,
  polygonZkEvm,
  scroll,
  zkSync,
  scrollSepolia,
  sepolia,
  blast,
} from '@wagmi/core/chains';
import { Transport, http } from 'viem';
import { tron } from './tron';
import { CHAIN_IDS, ChainData, ChainIds, Chains } from '.';
import { xLayer } from './xLayer';

export const MAINNET_CHAIN_NAMES: { [key in ChainIds]?: Chains } = {
  // evm
  [CHAIN_IDS.polygon]: 'polygon',
  [CHAIN_IDS.arbitrum]: 'arbitrum',
  [CHAIN_IDS.avalanche]: 'avalanche',
  [CHAIN_IDS.binance]: 'binance',
  [CHAIN_IDS.linea]: 'linea',
  [CHAIN_IDS.base]: 'base',

  // [CHAIN_IDS.ethereum]: 'ethereum',
  // [CHAIN_IDS.optimism]: 'optimism',
  // [CHAIN_IDS.zksync]: 'zksync',
  // [CHAIN_IDS.polygon_zkevm]: 'polygon_zkevm',
  // [CHAIN_IDS.manta]: 'manta',
  // [CHAIN_IDS.scroll]: 'scroll',
  // [CHAIN_IDS.mantle]: 'mantle',
  // [CHAIN_IDS.blast]: 'blast',
  // [CHAIN_IDS.xlayer]: 'xlayer',

  // tron
  // [CHAIN_IDS.tron]: 'tron',
} as const;
export const MAINNET_CHAIN_IDS: { [key in Chains]?: ChainIds } = {
  // evm
  polygon: CHAIN_IDS.polygon,
  // ethereum: CHAIN_IDS.ethereum,
  arbitrum: CHAIN_IDS.arbitrum,
  // optimism: CHAIN_IDS.optimism,
  // zksync: CHAIN_IDS.zksync,
  avalanche: CHAIN_IDS.avalanche,
  binance: CHAIN_IDS.binance,
  linea: CHAIN_IDS.linea,
  // polygon_zkevm: CHAIN_IDS.polygon_zkevm,
  // manta: CHAIN_IDS.manta,
  // scroll: CHAIN_IDS.scroll,
  // mantle: CHAIN_IDS.mantle,
  base: CHAIN_IDS.base,
  // blast: CHAIN_IDS.blast,
  // xlayer: CHAIN_IDS.xlayer,

  // tron
  // tron: CHAIN_IDS.tron,
} as const;

export const MAINNET_SUPPORTED_CHAIN_IDS: { [key in Chains]?: ChainIds } = {
  // ethereum: CHAIN_IDS.ethereum,
  polygon: CHAIN_IDS.polygon,
  arbitrum: CHAIN_IDS.arbitrum,
  // optimism: CHAIN_IDS.optimism,
  // zksync: CHAIN_IDS.zksync,
  avalanche: CHAIN_IDS.avalanche,
  binance: CHAIN_IDS.binance,
  linea: CHAIN_IDS.linea,
  // polygon_zkevm: CHAIN_IDS.polygon_zkevm,
  // manta: CHAIN_IDS.manta,
  // scroll: CHAIN_IDS.scroll,
  // mantle: CHAIN_IDS.mantle,
  base: CHAIN_IDS.base,
  // blast: CHAIN_IDS.blast,
  // xlayer: CHAIN_IDS.xlayer,

  // tron
  // tron: CHAIN_IDS.tron,
};

export const TESTNET_CHAIN_NAMES: { [key in ChainIds]?: Chains } = {
  5: 'goerli',
  43113: 'fuji',
  80001: 'mumbai',
  534351: 'scrollSepolia',
  11155111: 'sepolia',
} as const;
export const TESTNET_CHAIN_IDS: { [key in Chains]?: ChainIds } = {
  goerli: '5',
  fuji: '43113',
  mumbai: '80001',
  scrollSepolia: '534351',
  sepolia: '11155111',
} as const;

export const CHAINS_DATA: Record<ChainIds, ChainData> = {
  [CHAIN_IDS.ethereum]: mainnet,
  [CHAIN_IDS.polygon]: polygon,
  [CHAIN_IDS.arbitrum]: arbitrum,
  [CHAIN_IDS.optimism]: optimism,
  [CHAIN_IDS.zksync]: zkSync,
  [CHAIN_IDS.avalanche]: avalanche,
  [CHAIN_IDS.binance]: bsc,
  [CHAIN_IDS.polygon_zkevm]: polygonZkEvm,
  [CHAIN_IDS.manta]: manta,
  [CHAIN_IDS.scroll]: scroll,
  [CHAIN_IDS.mantle]: mantle,
  [CHAIN_IDS.base]: base,
  [CHAIN_IDS.linea]: linea,
  [CHAIN_IDS.blast]: blast,
  [CHAIN_IDS.xlayer]: xLayer,

  // tron
  [CHAIN_IDS.tron]: tron,

  // testnets
  5: goerli,
  80001: polygonMumbai,
  43113: avalancheFuji,
  534351: scrollSepolia,
  11155111: sepolia,
} as const;

export const EVM_CHAINS = [
  CHAIN_IDS.ethereum,
  CHAIN_IDS.polygon,
  CHAIN_IDS.arbitrum,
  CHAIN_IDS.optimism,
  CHAIN_IDS.zksync,
  CHAIN_IDS.avalanche,
  CHAIN_IDS.binance,
  CHAIN_IDS.polygon_zkevm,
  CHAIN_IDS.manta,
  CHAIN_IDS.scroll,
  CHAIN_IDS.mantle,
  CHAIN_IDS.base,
  CHAIN_IDS.linea,
  CHAIN_IDS.blast,
  CHAIN_IDS.xlayer,

  // testnet
  CHAIN_IDS.goerli,
  CHAIN_IDS.mumbai,
  CHAIN_IDS.fuji,
  CHAIN_IDS.scrollSepolia,
  CHAIN_IDS.sepolia,
] as const;

export type EvmChainIds = (typeof EVM_CHAINS)[number];

export const MAINNET_CHAINS = Object.values(MAINNET_CHAIN_IDS).reduce(
  (acc, key) => {
    acc.push(CHAINS_DATA[key]);
    return acc;
  },
  [] as unknown as [ChainData, ...ChainData[]],
);

export const TESTNET_CHAINS = Object.values(TESTNET_CHAIN_IDS).reduce(
  (acc, key) => {
    acc.push(CHAINS_DATA[key as ChainIds]);
    return acc;
  },
  [] as unknown as [ChainData, ...ChainData[]],
);

export const MAINNET_EVM_CHAINS = Object.values(MAINNET_CHAIN_IDS).reduce(
  (acc, key) => {
    if (EVM_CHAINS.find((chainId) => chainId === key)) {
      acc.push(CHAINS_DATA[key as ChainIds] as Chain);
    }
    return acc;
  },
  [] as unknown as [Chain, ...Chain[]],
);

export const TESTNET_EVM_CHAINS = Object.values(TESTNET_CHAIN_IDS).reduce(
  (acc, key) => {
    if (EVM_CHAINS.find((chainId) => chainId === key)) {
      acc.push(CHAINS_DATA[key as ChainIds] as Chain);
    }
    return acc;
  },
  [] as unknown as [Chain, ...Chain[]],
);

export const ALL_EVM_CHAINS = MAINNET_EVM_CHAINS.concat(TESTNET_EVM_CHAINS);

export const EVM_TRANSPORTS: { [key in string]: Transport } = {
  [CHAIN_IDS.ethereum]: http(),
  [CHAIN_IDS.polygon]: http(),
  [CHAIN_IDS.arbitrum]: http(),
  [CHAIN_IDS.optimism]: http(),
  [CHAIN_IDS.zksync]: http(),
  [CHAIN_IDS.avalanche]: http(),
  [CHAIN_IDS.binance]: http(),
  [CHAIN_IDS.polygon_zkevm]: http(),
  [CHAIN_IDS.manta]: http(),
  [CHAIN_IDS.scroll]: http(),
  [CHAIN_IDS.mantle]: http(),
  [CHAIN_IDS.base]: http(),
  [CHAIN_IDS.linea]: http(),
  [CHAIN_IDS.blast]: http(),
  [CHAIN_IDS.xlayer]: http(),

  // testnets
  [CHAIN_IDS.goerli]: http(),
  [CHAIN_IDS.fuji]: http(),
  [CHAIN_IDS.mumbai]: http(),
  [CHAIN_IDS.scrollSepolia]: http(),
  [CHAIN_IDS.sepolia]: http(),
};

export let SUPPORTED_CHAIN_NAMES: { [key in ChainIds]?: Chains } = {
  ...MAINNET_CHAIN_NAMES,
  ...TESTNET_CHAIN_NAMES,
};
export let SUPPORTED_CHAIN_IDS: { [key in Chains]?: ChainIds } = {
  ...MAINNET_CHAIN_IDS,
  ...TESTNET_CHAIN_IDS,
};
