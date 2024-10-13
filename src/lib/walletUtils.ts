import { WALLET_MAP } from '@/constants/wallets';
import { NetworkType, WalletId } from '@/types/WalletContextTypes';
import { Connector } from 'wagmi';

export const getEvmConnectorId = async (connector: Connector) => {
  if (!connector.getProvider) return undefined;

  const provider: any = await connector.getProvider();

  if (provider.isFrame) {
    return 'sh.frame';
  }
  if (provider.isSafe) {
    return 'safe';
  }
  if (provider.isTrust) {
    return 'trust';
  }
  if (provider.isRabby) {
    return 'io.rabby';
  }
  if (provider.isMetamask) {
    return 'io.metamask';
  }

  return connector.id;
};

export const getWallet = (id: string, connector?: Connector) => {
  if (WALLET_MAP[id as WalletId]) return WALLET_MAP[id as WalletId];

  if (connector) {
    WALLET_MAP[id as WalletId] = {
      id: connector.id,
      name: connector.name,
      icon: connector.icon ?? '',
      connector,
      type: NetworkType.EVM,
    };

    return WALLET_MAP[id as WalletId];
  }

  return undefined;
};
