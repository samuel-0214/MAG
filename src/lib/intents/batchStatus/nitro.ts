import { ChainIds } from '@/constants/chains';
import { getTransactionReceiptFromChain } from '@/lib/getTransactionFromChain';
import { getTransactionFromNitroExplorer } from '@/lib/utils';
import { AdapterStatus, BatchParams, BatchStatusData } from '@/types';
import { getAdapterStatusesFromLogs } from '../adapterStatus';
import { parseEventLogs } from 'viem';
import { NitroAbi } from '@/lib/abi/nitroAbi';
import { getTransactionReceipt, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/context/WagmiContext';

export const waitForNitro = async ({
  sourceTxHash,
  environment,
  batchAdapter,
}: BatchParams & {
  environment: 'mainnet' | 'testnet';
}): Promise<BatchStatusData> => {
  const transaction = await getTransactionReceipt(wagmiConfig, {
    chainId: Number(batchAdapter.sourceChainId),
    hash: sourceTxHash as `0x${string}`,
  }).catch((e) => {
    return waitForTransactionReceipt(wagmiConfig, {
      chainId: Number(batchAdapter.sourceChainId),
      hash: sourceTxHash as `0x${string}`,
      timeout: 1000 * 60 * 2, // 2 minutes
    });
  });
  const parsedEventLog = parseEventLogs({
    abi: NitroAbi,
    logs: transaction.logs,
    eventName: ['FundsDeposited', 'FundsDepositedWithMessage'],
  });

  if (!parsedEventLog.length) {
    return {
      status: 'src_failed',
      batchData: {
        srcTxHash: sourceTxHash,
        destTxHash: '',
      },
      adapterStatuses: {},
    };
  }

  return new Promise((resolve, reject) => {
    const checkTx = async () => {
      const tx = await getTransactionFromNitroExplorer(sourceTxHash, environment);
      const txData = tx?.findNitroTransactionByFilter;

      if (txData) {
        if (txData?.dest_tx_hash) {
          clearInterval(interval);

          let adapterStatuses: Record<string, AdapterStatus> = {};

          if (batchAdapter.adapterIndices?.length) {
            const destTx = await getTransactionReceiptFromChain({
              chainId: batchAdapter.destChainId as ChainIds,
              txHash: txData?.dest_tx_hash,
            }).catch((e) => {
              console.error('Error fetching dest tx', txData?.dest_tx_hash, batchAdapter.destChainId, e);
            });

            if (!destTx) {
              resolve({
                status: 'error',
                batchData: {
                  srcTxHash: sourceTxHash,
                  destTxHash: txData?.dest_tx_hash,
                },
                adapterStatuses: {},
              });
              return;
            }

            // check if OperationSuccess event is present in the logs
            const successEvent = parseEventLogs({
              abi: [{ anonymous: false, inputs: [], name: 'OperationSuccessful', type: 'event' }],
              logs: destTx.logs,
              eventName: 'OperationSuccessful',
            });

            if (successEvent.length === 0) {
              resolve({
                status: 'dest_failed',
                batchData: {
                  srcTxHash: sourceTxHash,
                  destTxHash: txData?.dest_tx_hash,
                },
                adapterStatuses: {},
              });
              return;
            }

            adapterStatuses = await getAdapterStatusesFromLogs({
              transaction: destTx,
              adapters: batchAdapter.adapters,
            });
          }

          resolve({
            status: 'successful',
            batchData: {
              srcTxHash: txData?.src_tx_hash,
              destTxHash: txData?.dest_tx_hash,
            },
            adapterStatuses,
          });
        }
        if (txData?.status === 'failed') {
          clearInterval(interval);

          reject('Crosschain transaction failed');
        }
      }
      if (tx?.error) {
        clearInterval(interval);
        reject(tx.error);
      }
    };

    checkTx();
    const interval = setInterval(checkTx, 5000);
  });
};
