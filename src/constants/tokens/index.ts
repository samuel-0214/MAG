import { z } from 'zod';
import { CHAIN_IDS, ChainIds } from '../chains';
import goerliTokens from './networks/goerli.json';
import mumbaiTokens from './networks/mumbai.json';
import fujiTokens from './networks/fuji.json';
import ethereumTokens from './networks/ethereum.json';
import polygonTokens from './networks/polygon.json';
import arbitrumTokens from './networks/arbitrum.json';
import optimismTokens from './networks/optimism.json';
import zksyncTokens from './networks/zksync.json';
import avalancheTokens from './networks/avalanche.json';
import binanceTokens from './networks/binance.json';
import polygonZkevmTokens from './networks/polygon_zkevm.json';
import mantaTokens from './networks/manta.json';
import scrollTokens from './networks/scroll.json';
import scrollSepoliaTokens from './networks/scrollSepolia.json';
import sepoliaTokens from './networks/sepolia.json';
import mantleTokens from './networks/mantle.json';
import baseTokens from './networks/base.json';
import lineaTokens from './networks/linea.json';
import tronTokens from './networks/tron.json';
import blastTokens from './networks/blast.json';
import xLayerTokens from './networks/xLayer.json';

const ChainsSchema = z.enum(Object.keys(CHAIN_IDS) as [string, ...string[]]);

export interface TokenBalanceData {
  chainId: ChainIds;
  tokenAddress: string;
}

const TokenSchema = z.object({
  symbol: z.string(),
  address: z.string(),
  decimals: z.number(),
  chainId: z.string(),
});

export type Token = z.infer<typeof TokenSchema>;

const TokenMapSchema = z
  .record(z.string(), z.record(z.string(), TokenSchema))
  .refine(
    (obj): obj is Required<typeof obj> => ChainsSchema.options.every((key) => obj[key] != null),
    (v) => ({ message: `TokenMapSchema: missing chainId ${JSON.stringify(v)}` }),
  )
  .refine(
    (obj) => {
      const chainIds = Object.keys(obj) as ChainIds[];
      return chainIds.every((chainId) => {
        const tokens = obj[chainId];
        return Object.keys(tokens).every((tokenAddress) => {
          return tokens[tokenAddress].address === tokenAddress;
        });
      });
    },
    (v) => ({ message: `TokenMapSchema: token address and key mismatch ${JSON.stringify(v)}` }),
  );

export type TokenMap = z.infer<typeof TokenMapSchema>;

export const TOKEN_MAP: TokenMap = {
  [CHAIN_IDS.goerli]: goerliTokens,
  [CHAIN_IDS.mumbai]: mumbaiTokens,
  [CHAIN_IDS.fuji]: fujiTokens,
  [CHAIN_IDS.ethereum]: ethereumTokens,
  [CHAIN_IDS.polygon]: polygonTokens,
  [CHAIN_IDS.arbitrum]: arbitrumTokens,
  [CHAIN_IDS.optimism]: optimismTokens,
  [CHAIN_IDS.zksync]: zksyncTokens,
  [CHAIN_IDS.avalanche]: avalancheTokens,
  [CHAIN_IDS.binance]: binanceTokens,
  [CHAIN_IDS.polygon_zkevm]: polygonZkevmTokens,
  [CHAIN_IDS.manta]: mantaTokens,
  [CHAIN_IDS.scroll]: scrollTokens,
  [CHAIN_IDS.mantle]: mantleTokens,
  [CHAIN_IDS.base]: baseTokens,
  [CHAIN_IDS.linea]: lineaTokens,
  [CHAIN_IDS.blast]: blastTokens,
  [CHAIN_IDS.tron]: tronTokens,
  [CHAIN_IDS.scrollSepolia]: scrollSepoliaTokens,
  [CHAIN_IDS.sepolia]: sepoliaTokens,
  [CHAIN_IDS.xlayer]: xLayerTokens,
};

export const TOKEN_SYMBOL_MAP = Object.entries(TOKEN_MAP).reduce(
  (symbolMapAcc, [chainId, chainTokens]) => {
    symbolMapAcc[chainId] = Object.values(chainTokens).reduce(
      (chainAcc, token) => {
        chainAcc[token.symbol] = token;
        return chainAcc;
      },
      {} as Record<string, Token>,
    );
    return symbolMapAcc;
  },
  {} as Record<string, Record<string, Token>>,
);

export const CHAIN_TOKEN_STETH_ADDRESS_MAP = {
  [CHAIN_IDS.goerli]: '',
  [CHAIN_IDS.mumbai]: '',
  [CHAIN_IDS.fuji]: '',
  [CHAIN_IDS.ethereum]: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  [CHAIN_IDS.polygon]: '',
  [CHAIN_IDS.arbitrum]: '0x5979D7b546E38E414F7E9822514be443A4800529',
  [CHAIN_IDS.optimism]: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
  [CHAIN_IDS.zksync]: '0x703b52F2b28fEbcB60E1372858AF5b18849FE867',
  [CHAIN_IDS.avalanche]: '',
  [CHAIN_IDS.binance]: '',
  [CHAIN_IDS.polygon_zkevm]: '',
  [CHAIN_IDS.manta]: '',
  [CHAIN_IDS.scroll]: '',
  [CHAIN_IDS.mantle]: '',
  [CHAIN_IDS.base]: '',
  [CHAIN_IDS.linea]: '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F',
  [CHAIN_IDS.tron]: '',
  [CHAIN_IDS.scrollSepolia]: '',
  [CHAIN_IDS.sepolia]: '',
  [CHAIN_IDS.blast]: '',
  [CHAIN_IDS.xlayer]: '',
};

export const STAKE_STONE_ADDRESSES: { [key: string]: string } = {
  '534352': '0x80137510979822322193FC997d400D5A6C747bf7',
  '1': '0x7122985656e38BDC0302Db86685bb972b145bD3C',
  '196': '0x80137510979822322193fc997d400d5a6c747bf7',
};
