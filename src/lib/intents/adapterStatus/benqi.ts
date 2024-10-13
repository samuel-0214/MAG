import { BenqiAbi } from '@/lib/abi/benqi';
import { AdapterStatus, GetAdapterStatusParams } from '@/types';
import { parseEventLogs } from 'viem';

export const getBenqiStakeStatus = async ({ transaction, adapter }: GetAdapterStatusParams): Promise<AdapterStatus> => {
  const parsedEventLog = parseEventLogs({
    abi: BenqiAbi,
    logs: transaction.logs,
    eventName: 'Submitted',
  });

  if (parsedEventLog.length === 0) {
    return 'failed';
  }

  return 'successful';
};
