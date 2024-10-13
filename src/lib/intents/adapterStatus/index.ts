import { AdapterMapItem, AdapterStatus } from '@/types';
import { AdapterIdParamsResponse } from '@/types/intents';
import { TransactionReceipt } from 'viem';
import { getBenqiStakeStatus } from './benqi';
import { getNitroBridgeStatus } from './nitro';
import { getLidoStakeStatus } from './lido';

export const getAdapterStatusesFromLogs = async ({
  transaction,
  adapters,
}: {
  transaction: TransactionReceipt;
  adapters: AdapterMapItem[];
}) => {
  let adapterStatuses: Record<string, AdapterStatus> = {};

  for (const adapter of adapters) {
    console.log('adapter', adapter.adapterId);
    const status = await getAdapterStatusFromLogs({ transaction, adapter }).catch((e) => {
      console.error('Error getting adapter status', e);
      return 'error' as AdapterStatus;
    });
    adapterStatuses[adapter.adapterIndex] = status;
  }

  return adapterStatuses;
};

export const getAdapterStatusFromLogs = async ({
  transaction,
  adapter,
}: {
  transaction: TransactionReceipt;
  adapter: AdapterIdParamsResponse;
}): Promise<AdapterStatus> => {
  switch (adapter.adapterId) {
    case 'benqi_stake':
      return getBenqiStakeStatus({ transaction, adapter });
    case 'nitro_bridge':
      return getNitroBridgeStatus({ transaction, adapter });
    case 'lido':
      getLidoStakeStatus({ transaction, adapter });
  }

  return 'successful';
};
