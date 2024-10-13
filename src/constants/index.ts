import { Chains } from './chains';

export const TRUST_WALLET_EXCEPTIONS: { [key in Chains]?: string } = {
  polygon_zkevm: 'polygonzkevm',
  avalanche: 'avalanchec',
  binance: 'smartchain',
  goerli: 'ethereum',
  mumbai: 'polygon',
  fuji: 'avalanche',
};

// export const INTENTS_BASE_URI = 'https://api.routerintents.com';
export const INTENTS_BASE_URI = 'https://api.pod.routerintents.com';
export const INTENTS_BASE_URI_TESTNET = 'https://api.routerintents.com';
export const TAGZZ_RNS_URI = 'https://api.tagzz.xyz';
