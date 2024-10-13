import { wagmiConfig } from '@/context/WagmiContext';
import { BatchParams, BatchStatusData } from '@/types';
import { getTransactionReceipt, waitForTransactionReceipt } from '@wagmi/core';
import { parseEventLogs } from 'viem';
import { LayerZeroAbi } from '@/lib/abi/layerZeroUltraNodeV2';
import { createClient } from '@layerzerolabs/scan-client';

export const waitForLayerZeroBridge = async ({
  batchAdapter,
  destChainId,
  sourceChainId,
  sourceTxHash,
}: BatchParams): Promise<BatchStatusData> => {
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
    abi: LayerZeroAbi,
    logs: transaction.logs,
    eventName: ['Packet'],
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

  const client = createClient('mainnet');

  return new Promise((resolve, reject) => {
    const checkTx = async () => {
      const l0tx = await client.getMessagesBySrcTxHash(sourceTxHash);
      if (l0tx.messages[0]?.status === 'DELIVERED') {
        clearInterval(interval);
        resolve({
          status: 'successful',
          batchData: {
            srcTxHash: sourceTxHash,
            destTxHash: l0tx.messages[0].dstTxHash ?? '',
          },
          adapterStatuses: {},
        });
      }
      if (l0tx.messages[0]?.status === 'FAILED') {
        clearInterval(interval);
        reject('L2_BRIDGE_FAILED');
      }
    };

    checkTx();
    const interval = setInterval(checkTx, 10_000);
  });
};
