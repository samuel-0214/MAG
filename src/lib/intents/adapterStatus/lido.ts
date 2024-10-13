import { LidoAbi } from '@/lib/abi/lido';
import { AdapterStatus, GetAdapterStatusParams } from '@/types';
import { parseEventLogs } from 'viem';

export const getLidoStakeStatus = async ({ transaction, adapter }: GetAdapterStatusParams): Promise<AdapterStatus> => {
  const parsedEventLog = parseEventLogs({
    abi: LidoAbi,
    logs: transaction.logs,
    eventName: '',
  });

  if (parsedEventLog.length === 0) {
    return 'failed';
  }

  return 'successful';
};
