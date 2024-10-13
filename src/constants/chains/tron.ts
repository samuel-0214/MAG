import { NetworkType } from '.';

export const tron = {
  id: '0x2b6653dc',
  type: NetworkType.TRON,
  name: 'Tron',
  nativeCurrency: { name: 'Tron', symbol: 'TRX', decimals: 6 },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/tron_jsonrpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tronscan',
      url: 'https://tronscan.org',
      apiUrl: 'https://apilist.tronscanapi.com/api',
    },
  },
  contracts: {},
};
