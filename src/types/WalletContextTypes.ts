import { Dispatch, SetStateAction } from 'react';
import { Connector } from 'wagmi';

export enum NetworkType {
  EVM = 'evm',
  COSMOS = 'cosmos',
  TRON = 'tron',
  NEAR = 'near',
}

export const WALLET_ID = {
  injected: 'injected',
  metamask: 'metamask',
  walletConnect: 'walletConnect',
  coinbaseWalletSDK: 'coinbaseWalletSDK',
  'io.metamask': 'io.metamask',
  'io.rabby': 'io.rabby',
  'sh.frame': 'sh.frame',
  'app.phantom': 'app.phantom',
  safe: 'safe',
  keplr: 'keplr',
  trust: 'trust',
  tronLink: 'tronLink',
  exodus: 'exodus',
} as const;

export type WalletId = string;

export type Wallet = {
  id: WalletId;
  name: string;
  type: NetworkType;
  icon: string;
  installed?: boolean;
  downloadUrl?: string;
  disabled?: boolean;
  hidden?: boolean;
  connector?: Connector;
};

export type WalletData = {
  address: string;
  loading?: boolean;
  chainId: string | undefined;
};

export type CurrentWallet = {
  id: WalletId;
  type: NetworkType;
};

export type ConnectedWallets = {
  [key in NetworkType]: {
    [key in WalletId]?: WalletData;
  };
};
export const initialConnectedWallets: ConnectedWallets = {
  [NetworkType.EVM]: {},
  [NetworkType.COSMOS]: {},
  [NetworkType.TRON]: {},
  [NetworkType.NEAR]: {},
};

export type ConnectedAccounts = {
  [key in WalletId]?: Account;
};

export type Account = {
  address: string;
  chainId: string | undefined;
  networkType: NetworkType;
  wallet: WalletId;
};

export type WalletContextValues = {
  currentAccount: Account | undefined;
  currentWallet: CurrentWallet | undefined;

  currentChainId: string | undefined;

  activeAccounts: { [key in NetworkType]?: Account };

  connectedAccounts: ConnectedAccounts;
  connectedWallets: ConnectedWallets;

  currentEvmWalletConnector: Connector | undefined;
  // connect wallet
  connectWallet: (walletId: WalletId) => void;
  openWalletModal: () => void;

  // switch chain
  switchChain: (chainId: string) => void;

  // disconnect wallet
  disconnectWallet: (walletId: WalletId) => void;
  disconnectAllWallets: () => void;

  // get account
  getAccountByNetwork: (networkType: NetworkType) => void;
  getAccount: (account: string) => void;
  getAccounts: () => void;

  // setters
  setConnectedWallets: Dispatch<SetStateAction<ConnectedWallets>>;
  setConnectedAccounts: Dispatch<SetStateAction<ConnectedAccounts>>;
  setCurrentAccount: Dispatch<SetStateAction<Account | undefined>>;
  setCurrentWallet: Dispatch<SetStateAction<CurrentWallet | undefined>>;
};
