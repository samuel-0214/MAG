import { ChainIds } from '@/constants/chains';
import { getTransactionFromChain, getTransactionReceiptFromChain } from '@/lib/getTransactionFromChain';
import { getAdapterStatusesFromLogs } from '@/lib/intents/adapterStatus';
import { queryBatch } from '@/lib/intents/batchQueries';
import { isAdapterBridge } from '@/lib/intents/utils';
import {
  AdapterMap,
  AdapterStatus,
  Batch,
  BatchQueryCallback,
  BatchStatusMap,
  IntentTxData,
  TransactionStatusContextState,
} from '@/types';
import { TransactionDetails } from '@/types/intents';
import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { zeroAddress } from 'viem';

const TransactionStatusContext = createContext<TransactionStatusContextState>({
  adapterStatuses: {},
  adapters: [],
  intentTxDataError: null,
  isIntentTxDataLoading: undefined,
  sourceTxData: undefined,
  adapterMap: undefined,
  batch: undefined,
});

const TransactionStatusContextProvider = ({
  children,
  sourceChainId,
  sourceTxHash,
  transactionData,
  onTxComplete,
}: {
  children: ReactNode;
  sourceChainId: string;
  sourceTxHash: string;
  transactionData: TransactionDetails | undefined;
  onTxComplete?: (adapterStatuses?: BatchStatusMap) => void;
}) => {
  const [txComplete, setTxComplete] = useState(false);
  const [adapterStatuses, setAdapterStatuses] = useState<BatchStatusMap>({});

  const {
    data: intentTxData,
    isLoading: isIntentTxDataLoading,
    error: intentTxDataError,
  } = useQuery<IntentTxData>({
    queryKey: [
      'intentTxData',
      sourceChainId,
      sourceTxHash,
      'adapters:',
      transactionData?.adapters?.length,
      transactionData,
      transactionData?.adapters,
    ],
    queryFn: async () => {
      // // wait for transaction
      const sourceTx = await getTransactionFromChain({
        chainId: sourceChainId as ChainIds,
        txHash: sourceTxHash,
      });
      const sourceTxReceipt = await getTransactionReceiptFromChain({
        chainId: sourceChainId as ChainIds,
        txHash: sourceTxHash,
      });

      if (!sourceTx) {
        throw new Error('Error getting source transaction');
      }
      if (!transactionData) {
        throw new Error('No transaction data');
      }

      const adapterMap = transactionData.adapters;

      // TODO
      // if adapters are available, return them
      // if not, get adapters from the source transaction calldata
      // const adapters = decodeAdaptersFromCallData(sourceTx.input);

      const adapters = Object.values(adapterMap);

      const batch: Batch[] = Object.values(adapterMap).map((adapter) => ({
        id: adapter.adapterIndex,
        batch: adapter.adapterIndices,
      }));

      return {
        sourceTxData: {
          chainId: sourceChainId,
          to: sourceTx.to?.toString() || '',
          from: sourceTx.from?.toString() || '',
          value: sourceTx.value?.toString(),
          data: sourceTx.input?.toString(),
          hash: sourceTx.hash as string,
          transaction: sourceTx,
          txReceipt: sourceTxReceipt,
        },
        adapters: adapters,
        adapterMap: adapterMap,
        batch: batch,
      };
    },
    staleTime: Infinity,
    enabled: !!sourceTxHash && !!transactionData,
  });

  useQuery({
    queryKey: ['intentTxStatus', !!intentTxData, sourceTxHash],
    queryFn: async () => {
      if (!intentTxData || !sourceTxHash || !intentTxData) return;

      const batchQueryCallback: BatchQueryCallback = (batchId, status, batchData, adapterStatuses) => {
        // console.log('batchId', batchId, status);

        const batchAdapterStatuses = Object.entries(adapterStatuses).reduce((acc, curr) => {
          const [index, status] = curr;
          return {
            ...acc,
            [index]: {
              status: status as AdapterStatus,
              data: {
                srcTxHash: batchData.destTxHash,
              },
            },
          };
        }, {} as BatchStatusMap);

        setAdapterStatuses((prev) => ({
          ...prev,
          [batchId]: {
            status,
            data: batchData,
          },
          ...batchAdapterStatuses,
        }));
      };

      const sourceAdapters = intentTxData.adapters.filter((adapter) => adapter.adapterIndex.split('-').length === 2);
      const sourceBatch = {
        id: 'source',
        batch: sourceAdapters.map((adapter) => adapter.adapterIndex),
      };

      // update source adapter statuses
      await getAdapterStatusesFromLogs({
        transaction: intentTxData.sourceTxData.txReceipt!,
        adapters: sourceAdapters,
      }).then((adapterStatuses) => {
        batchQueryCallback('source', 'successful', {}, adapterStatuses);
      });

      console.log('sourceBatch', sourceBatch);

      return await queryBatch({
        batchId: 'source',
        batches: sourceBatch.batch,
        adapterMap: intentTxData.adapterMap,
        txHash: sourceTxHash,
        callback: batchQueryCallback,
      }).then((res) => {
        // completed querying batches
        setTxComplete(true);
        return res;
      });

      // return await Promise.all(sourceBatchPromises).catch((e) => {
      //   console.error('Error querying batch', e);
      //   return e;
      // });
    },

    refetchOnWindowFocus: false,
    // staleTime: 60 * 1000, // 1 minute
    enabled: !!intentTxData && !!sourceTxHash,
  });

  useEffect(() => {
    if (txComplete) {
      console.log('txComplete', txComplete);
      if (onTxComplete) onTxComplete(adapterStatuses);
    }
  }, [adapterStatuses, onTxComplete, txComplete]);

  return (
    <TransactionStatusContext.Provider
      value={{
        adapterStatuses,
        // adapterStatuses,
        isIntentTxDataLoading,
        intentTxDataError,
        ...intentTxData,
      }}
    >
      {children}
    </TransactionStatusContext.Provider>
  );
};

export const useTransactionStatusContext = () => {
  return useContext(TransactionStatusContext);
};

export default TransactionStatusContextProvider;
