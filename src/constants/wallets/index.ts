import { NetworkType, Wallet, WalletId } from '@/types/WalletContextTypes';

export const WALLETS: Wallet[] = [
  {
    name: 'Browser',
    icon: '/images/icons/Browser.svg',
    type: NetworkType.EVM,
    id: 'injected',
  },
  {
    name: 'MetaMask',
    icon: '/images/icons/MetaMask.svg',
    type: NetworkType.EVM,
    id: 'io.metamask',
  },
  {
    name: 'Rabby',
    icon: '/images/icons/rabbyWallet.svg',
    type: NetworkType.EVM,
    id: 'io.rabby',
  },
  {
    name: 'Trust',
    icon: '/images/icons/Trust.svg',
    type: NetworkType.EVM,
    id: 'com.trustwallet.app',
  },
  {
    name: 'Phantom',
    icon: '/images/icons/phantom.svg',
    type: NetworkType.EVM,
    id: 'app.phantom',
  },
  {
    name: 'Wallet Connect',
    icon: '/images/icons/walletConnect.svg',
    type: NetworkType.EVM,
    id: 'walletConnect',
  },
  {
    name: 'Coinbase',
    icon: '/images/icons/coinbase.svg',
    type: NetworkType.EVM,
    id: 'coinbaseWalletSDK',
  },
  {
    name: 'Safe',
    icon: '/images/icons/safe.svg',
    type: NetworkType.EVM,
    id: 'safe',
  },
  {
    name: 'Frame',
    icon: '/images/icons/frame.png',
    type: NetworkType.EVM,
    id: 'sh.frame',
  },
  {
    name: 'Keplr',
    icon: '/images/icons/Keplr.svg',
    type: NetworkType.COSMOS,
    id: 'keplr',
    disabled: true,
  },
  // {
  //   name: 'Tron Link',
  //   icon: '/images/icons/TronLink.svg',
  //   type: NetworkType.TRON,
  //   id: 'trust',
  //   disabled: true,
  // },
  {
    name: 'Tron',
    icon: '/images/icons/tronLink.svg',
    type: NetworkType.TRON,
    id: 'tronLink',
    // disabled: true,
  },
  // {
  //   name: 'Exodus',
  //   icon: '/images/icons/Exodus.svg',
  //   type: NetworkType.TRON,
  //   id: 'exodus',
  // },
] as const;

export const WALLET_MAP = WALLETS.reduce(
  (acc, wallet) => {
    acc[wallet.id] = wallet;
    return acc;
  },
  {} as Record<WalletId, Wallet>,
);
