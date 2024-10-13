import { NitroAbi } from '@/lib/abi/nitroAbi';
import { AdapterStatus, GetAdapterStatusParams } from '@/types';
import { parseEventLogs } from 'viem';

export const getNitroBridgeStatus = async ({
  transaction,
  adapter,
}: GetAdapterStatusParams): Promise<AdapterStatus> => {
  // check source event for nitro
  // return 'successful';
  const parsedEventLog = parseEventLogs({
    abi: NitroAbi,
    logs: transaction.logs,
    eventName: ['FundsDeposited', 'FundsDepositedWithMessage'],
  });

  if (parsedEventLog.length) {
    return 'successful';
  }

  return 'failed';
};
