import { INTENTS_BASE_URI, TRUST_WALLET_EXCEPTIONS } from '@/constants';
import { CHAIN_IDS, ChainIds, Chains, NetworkType } from '@/constants/chains';
import { CHAINS_DATA } from '@/constants/chains/list';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAddress } from 'viem';
import { NitroTransactionReceipt } from '../types/nitro';
import { TransactionDetails } from '@/types/intents';

/**
 * This is a workaround for the issue with BigInt serialization in JSON.stringify
 */
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalized = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const isTokenETH = (address: string) =>
  address && address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const areTokensEqual = (tokenA: string, tokenB: string) => tokenA.toLowerCase() === tokenB.toLowerCase();

export const shortenAddress = (address: string | undefined, chars = 4) =>
  address ? `${address.slice(0, chars + 2)}...${address.slice(-chars)}` : '';

export const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const fetchNitroGql = async (environment: string, query: string, variables: any) => {
  let url = '';
  if (environment === 'mainnet') {
    url = 'https://api.explorer.routernitro.com/graphql';
  } else {
    url = 'https://api.iswap-explorer-testnet.routerprotocol.com/graphql';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  return json.data;
};

export const getExplorerLink = (hash: string, chainId: ChainIds) => {
  const explorerUrl = CHAINS_DATA[chainId]?.blockExplorers?.default.url;
  return `${explorerUrl}/tx/${hash}`;
};

export const getExplorerTokenLink = (tokenAddress: string, chainId: ChainIds) => {
  const explorerUrl = CHAINS_DATA[chainId]?.blockExplorers?.default.url;
  return `${explorerUrl}/token/${tokenAddress}`;
};

export const NITRO_ENV = process.env.NEXT_PUBLIC_NITRO_ENV;

export const getNitroExplorerLink = (hash?: string) => {
  if (NITRO_ENV === 'mainnet') {
    const base = 'https://explorer.routernitro.com/';

    if (!hash) return base;
    return `${base}/tx/${hash}`;
  }

  const base = 'https://explorer-testnet.routernitro.com/';

  if (!hash) return base;
  return `${base}/tx/${hash}`;
};

const lineaTokenLogoURIs: {
  [address: string]: string;
} = {
  '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f':
    'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg',
  '0x7d43aabc515c356145049227cee54b608342c0ad': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4687.png',
  '0xf5C6825015280CdfD0b56903F9F8B5A2233476F5': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  '0x5471ea8f739dd37E9B81Be9c5c77754D8AA953E4': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  '0x265B25e22bcd7f10a5bD6E6410F10537Cc7567e8': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  '0x997BF0ebF2a2a2e8189493cedFd19bCDb077c0d0': 'https://noobysswap.io/assets/images/nbs_logo.png',
  '0x9201f3b9DfAB7C13Cd659ac5695D12D605B5F1e6': 'https://echodex.io/images/coins/ecp.png',
  '0x0963a1aBAF36Ca88C21032b82e479353126A1C4b':
    'https://raw.githubusercontent.com/LeetSwap/tokenlist/master/logos/leet.png',
  '0x9dd6ea6f9d1fba5ed640651f06802e32ff455221': 'https://i.ibb.co/NNzQ46L/Lin.png',
  '0x6C6470898882b65E0275723D883A0D877aADe43f': 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025',
  '0x66627F389ae46D881773B7131139b2411980E09E': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025',
  '0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747':
    'https://assets.coingecko.com/coins/images/21791/small/izumi-logo-symbol.png?1640053924',
  '0x0B1A02A7309dFbfAD1Cd4adC096582C87e8A3Ac1': 'https://i.ibb.co/QJjY1Dd/Circle-logo-black.png',
  '0x7f5373AE26c3E8FfC4c77b7255DF7eC1A9aF52a6': 'https://i.ibb.co/GQKtJb3/uusdt-D-3x.png',
  '0xEB466342C4d449BC9f53A865D5Cb90586f405215': 'https://i.ibb.co/DRYxg4N/uausdc-L-3x.png',
  '0x176211869cA2b568f2A7D4EE941E073a821EE1ff':
    'https://seeklogo.com/images/U/usd-coin-usdc-logo-CB4C5B1C51-seeklogo.com.png',
  '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4':
    'https://thumbs.dreamstime.com/b/wrapped-bitcoin-wbtc-token-symbol-cryptocurrency-logo-coin-icon-isolated-white-background-wrapped-bitcoin-wbtc-token-symbol-219820880.jpg',
  '0xA219439258ca9da29E9Cc4cE5596924745e12B93': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  '0x2140Ea50bc3B6Ac3971F9e9Ea93A1442665670e4': 'https://i.ibb.co/zmGrR16/500-500-px.png',
  '0x13a7F090D46C74acBA98c51786a5c46eD9A474F0': 'https://i.ibb.co/12Fy3g1/Ava-Scamfari.png',
  '0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376': 'https://i.ibb.co/khhLbd7/Group-27795.png',
  '0x2f0b4300074afc01726262d4cc9c1d2619d7297a': 'https://i.ibb.co/w0m0KsN/image-2023-11-15-16-59-48.jpg',
  '0xcc22F6AA610D1b2a0e89EF228079cB3e1831b1D1': 'https://linea.velocore.xyz/assets/LVC-8ac4b844.svg',
  '0x78354f8dccb269a615a7e0a24f9b0718fdc3c7a7':
    'https://raw.githubusercontent.com/Lynexfi/lynex-lists/main/tokens/assets/ZERO.png',
  '0x1a51b19ce03dbe0cb44c1528e34a7edd7771e9af': 'https://app.lynex.fi/logo.png',
  '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f': 'https://changenow.io/images/cached/weth.png',
  '0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png',
  '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F': 'https://cryptologos.cc/logos/steth-steth-logo.png',
  '0x1Bf74C010E6320bab11e2e5A532b5AC15e0b8aA6':
    'https://raw.githubusercontent.com/Lynexfi/lynex-lists/main/tokens/assets/weETH.png',
};

const scrollTokenLogoURIs: {
  [address: string]: string;
} = {
  '0x01f0a31698c4d065659b9bdc21b3610292a1c506':
    'https://raw.githubusercontent.com/Lynexfi/lynex-lists/main/tokens/assets/weETH.png',
  '0xf610a9dfb7c89644979b4a0f27063e9e7d7cda32': 'https://cryptologos.cc/logos/steth-steth-logo.png',
  '0xf55bec9cafdbe8730f096aa55dad6d22d44099df': 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025',
  '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025',
  '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  '0xAAAE8378809bb8815c08D3C59Eb0c7D1529aD769':
    'https://assets.coingecko.com/coins/images/38831/large/nuri_discord.png?1723623524',
  '0x80137510979822322193fc997d400d5a6c747bf7': 'https://s2.coinmarketcap.com/static/img/coins/64x64/32194.png',
  '0x5300000000000000000000000000000000000004':
    'https://token-repository.dappradar.com/tokens?protocol=ethereum&contract=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&file=logo.png',
  '0xa25b25548b4c98b0c7d3d27dca5d5ca743d68b7f':
    'https://www.nuri.exchange/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2FRamsesExchange%2Framses-assets%2Fmain%2Fblockchains%2Fscroll%2Fassets%2F0xa25b25548B4C98B0c7d3d27dcA5D5ca743d68b7F%2Flogo.png&w=96&q=75',
};

const xLayerTokenLogoURIs: {
  [address: string]: string;
} = {
  '0x74b7f16337b8972027f6196a17a631ac6de26d22':
    'https://seeklogo.com/images/U/usd-coin-usdc-logo-CB4C5B1C51-seeklogo.com.png',
  '0x5a77f1443d16ee5761d310e38b62f77f726bc71c':
    'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg',
};

const mantleTokenLogoURIs: {
  [address: string]: string;
} = {
  '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE': 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025',
  '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025',
  '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111': 'https://changenow.io/images/cached/weth.png',
  '0xC96dE26018A54D51c097160568752c4E3BD6C364': 'https://agni.finance/static/fbtc.png',
  '0xcDA86A272531e8640cD7F1a92c01839911B90bb0': 'https://agni.finance/static/meth.png',
  '0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2':
    'https://thumbs.dreamstime.com/b/wrapped-bitcoin-wbtc-token-symbol-cryptocurrency-logo-coin-icon-isolated-white-background-wrapped-bitcoin-wbtc-token-symbol-219820880.jpg',
};

export const getTokenLogoURI = (address: string, chain: Chains) => {
  if (!address) return '';
  if (isTokenETH(address))
    if (TRUST_WALLET_EXCEPTIONS[chain])
      return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${TRUST_WALLET_EXCEPTIONS[chain]}/info/logo.png`;
    else if (chain === 'xlayer') return 'https://s2.coinmarketcap.com/static/img/coins/200x200/3897.png';
    else return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;
  if (chain === 'linea') return lineaTokenLogoURIs[address];
  if (chain === 'xlayer') return xLayerTokenLogoURIs[address];
  if (chain === 'blast')
    return `https://raw.githubusercontent.com/ThrusterX/thruster-token-list/main/chains/81457/assets/${address}/token-logo.svg`;
  if (chain === 'scroll') return scrollTokenLogoURIs[address];
  if (chain === 'mantle') return mantleTokenLogoURIs[address];
  const logoUri = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

  if (TRUST_WALLET_EXCEPTIONS[chain]) {
    return `${logoUri}/${TRUST_WALLET_EXCEPTIONS[chain]}/assets/${getAddress(address)}/logo.png`;
  }

  return `${logoUri}/${chain}/assets/${getAddress(address)}/logo.png`;
};

export const getChainType = (chainId: string): NetworkType => {
  switch (chainId) {
    case CHAIN_IDS.avalanche:
    case CHAIN_IDS.binance:
    case CHAIN_IDS.arbitrum:
    case CHAIN_IDS.optimism:
    case CHAIN_IDS.polygon:
    case CHAIN_IDS.zksync:
    case CHAIN_IDS.polygon_zkevm:
    case CHAIN_IDS.manta:
    case CHAIN_IDS.scroll:
    case CHAIN_IDS.mantle:
    case CHAIN_IDS.base:
    case CHAIN_IDS.linea:
      return NetworkType.EVM;
    case CHAIN_IDS.tron:
      return NetworkType.TRON;

    default:
      throw new Error(`Chain ${chainId} is not supported`);
  }
};

export const getTransactionFromNitroExplorer = async (
  hash: string,
  environment: 'mainnet' | 'testnet',
): Promise<{ findNitroTransactionByFilter: NitroTransactionReceipt; error: any }> => {
  const testnetTxQuery = `query($hash:String!) {
  transaction(hash: $hash){
    dest_timestamp
    src_timestamp
    src_tx_hash
    dest_tx_hash
    status
    dest_address
    dest_amount
    dest_symbol
    fee_amount
    fee_address
    fee_symbol
    recipient_address
    deposit_id
    src_amount
    dest_amount
    src_stable_address
}}`;
  const mainnetTxQuery = `query($hash:String!) {
  findNitroTransactionByFilter(hash: $hash) {
    dest_timestamp
    src_timestamp
    src_tx_hash
    dest_tx_hash
    status
    dest_address
    dest_amount
    dest_symbol
    fee_amount
    fee_address
    fee_symbol
    recipient_address
    deposit_id
    src_amount
    dest_amount
    src_stable_address
  }
}`;
  const txnQuery = environment === 'mainnet' ? mainnetTxQuery : testnetTxQuery;
  const txn = await fetchNitroGql(environment, txnQuery, { hash });
  return txn;
};

export const updateDbTransaction = async ({
  id,
  hash,
  gasFee,
  status,
  refCode,
}: {
  id: string;
  hash: string;
  gasFee: string;
  status: 'FAILED' | 'COMPLETED' | 'PENDING';
  refCode?: string | '';
  // updateType: 'bulk' | 'adapter';
}) => {
  const res = await fetch(INTENTS_BASE_URI + '/router-intent/transaction/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      TransactionId: id,
      TransactionStatus: status,
      GasFeeUsed: gasFee.toString(),
      TransactionHash: hash,
      AdapterStatus: [],
      ReferenceCode: refCode,
    }),
  });

  return res;
};

export const getDbTransaction = async ({
  id,
  hash,
  account,
}: {
  id?: string;
  hash?: string;
  account?: string;
}): Promise<TransactionDetails> => {
  if (id) {
    const res = await fetch(INTENTS_BASE_URI + '/router-intent/transaction/get-by-trnx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TrnxId: id,
      }),
    }).then((res) => res.json());

    return res.PayLoad;
  }

  if (hash) {
    const res = await fetch(INTENTS_BASE_URI + '/router-intent/transaction/get-by-hash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Hash: hash,
      }),
    }).then((res) => res.json());

    return res.PayLoad;
  }

  if (account) {
    const res = await fetch(INTENTS_BASE_URI + '/router-intent/transaction/get-by-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        UserAddress: account,
      }),
    }).then((res) => res.json());

    return res.PayLoad;
  }

  throw new Error('Invalid params');
};
