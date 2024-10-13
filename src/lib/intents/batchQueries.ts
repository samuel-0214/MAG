import { ChainIds } from '@/constants/chains';
import { CHAINS_DATA } from '@/constants/chains/list';
import { AdapterMap, BatchParams, BatchQueryCallback, BatchStatusData } from '@/types';
import { waitForLidoBridge } from './batchStatus/lidoCanonical';
import { waitForNitro } from './batchStatus/nitro';
import { isAdapterBridge } from './utils';
import { waitForLayerZeroBridge } from './batchStatus/layerZeroCanonical';

export const queryBatch = async ({
  batchId,
  batches: adapters,
  adapterMap,
  txHash,
  callback,
}: {
  batchId: string;
  batches: string[];
  adapterMap: AdapterMap;
  txHash: string;
  callback: BatchQueryCallback;
}) => {
  const batchPromises: Promise<any>[] = [];

  const tabs = '\t'.repeat(batchId.split('-').length);
  console.debug(tabs, '[BATCH] QUERY', batchId);

  for (const adapterId of adapters) {
    if (!isAdapterBridge(adapterMap[adapterId].adapterType)) continue;

    const batchAdapter = adapterMap[adapterId];

    callback(adapterId, 'loading', {}, {});

    const statusPromise = awaitBatchCompletion({
      sourceChainId: batchAdapter.sourceChainId,
      destChainId: batchAdapter.destChainId,
      sourceTxHash: txHash,
      batchAdapter,
    })
      .then(async ({ status, batchData, adapterStatuses }) => {
        console.debug(tabs + '\t', '[BATCH] STATUS', adapterId, adapterMap[adapterId].adapterId, status);
        callback(adapterId, status, batchData, adapterStatuses);

        if (
          adapterId &&
          batchData.destTxHash &&
          status !== 'error' &&
          status !== 'dest_failed' &&
          status !== 'src_failed'
        ) {
          await queryBatch({
            batchId: adapterId,
            batches: adapterMap[adapterId].adapterIndices,
            adapterMap,
            txHash: batchData.destTxHash,
            callback,
          });
        }
      })
      .catch((e) => {
        console.error('Error fetching batch status', e);
        callback(adapterId, 'error', {}, {});
      });

    batchPromises.push(statusPromise);
  }

  return Promise.all(batchPromises).then((data) => {
    console.debug(tabs, '[BATCH] COMPLETE', batchId);

    return data;
  });
};

export const awaitBatchCompletion = async (batchParams: BatchParams): Promise<BatchStatusData> => {
  const { batchAdapter } = batchParams;

  console.debug(
    '\t'.repeat(batchAdapter.adapterIndex.split('-').length),
    '[BATCH] AWAIT',
    batchParams.batchAdapter.adapterIndex,
    batchParams.batchAdapter.adapterId,
  );

  // promise for nitro
  if (batchAdapter.adapterId === 'nitro_bridge') {
    const { sourceChainId, destChainId, sourceTxHash } = batchParams;

    let environment: 'mainnet' | 'testnet' = 'mainnet';
    if (CHAINS_DATA[sourceChainId as ChainIds].testnet) {
      environment = 'testnet';
    }

    return waitForNitro({ ...batchParams, environment });
  }

  // promises for other bridges
  if (batchAdapter.adapterId === 'lido_canonical_bridge') {
    return waitForLidoBridge(batchParams);
  }

  if (batchAdapter.adapterId === 'stakestone_canonical_bridge') {
    return waitForLayerZeroBridge(batchParams);
  }

  throw new Error(`Unsupported bridge or batch adapter ${batchAdapter.adapterIndex} ${batchAdapter.adapterId}`);
};
