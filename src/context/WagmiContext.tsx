import { ALL_EVM_CHAINS, EVM_TRANSPORTS } from '@/constants/chains/list';
import { Chain } from 'viem';
import { createConfig } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

// const chainList = NETWORK_ENV === 'mainnet' ? MAINNET_EVM_CHAINS : TESTNET_EVM_CHAINS;

export const wagmiConfig = createConfig({
  chains: ALL_EVM_CHAINS as [Chain, ...Chain[]],
  transports: EVM_TRANSPORTS,
  connectors: [
    injected(),
    walletConnect({ projectId: '949e50a7346865d10fe9757fe8dd9477' }),
    coinbaseWallet({
      appName: 'SuperBaseNames | PoC',
    }),
  ],
  ssr: true,
  batch: {
    multicall: {
      wait: 20,
    },
  },
});
