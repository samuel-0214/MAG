import TransactionStatusContextProvider from '@/context/TransactionStatusContext';
import { useQuery } from '@tanstack/react-query';
import TransactionAdapters from './TransactionAdapters';
import { getDbTransaction } from '@/lib/utils';
import { TransactionDetails } from '@/types/intents';
import { BatchStatusMap } from '@/types';

const IntentTransaction = ({
  txHash,
  onTxComplete,
}: {
  txHash: string;
  onTxComplete?: (adapterStatuses?: BatchStatusMap) => void;
}) => {
  const { data: txData } = useQuery({
    queryKey: ['txData', txHash],
    queryFn: async () => {
      const res = await getDbTransaction({
        hash: txHash,
      });
      return res as TransactionDetails;
    },
    enabled: !!txHash,
    retry: true,
    refetchOnWindowFocus: false,
  });
  return (
    <TransactionStatusContextProvider
      sourceChainId={txData?.sourceChainId || ''}
      sourceTxHash={txHash}
      transactionData={txData}
      onTxComplete={onTxComplete}
    >
      {/* print adapter flow */}
      <TransactionAdapters />
    </TransactionStatusContextProvider>
  );
};

export default IntentTransaction;
