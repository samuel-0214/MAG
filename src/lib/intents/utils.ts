import { Config, getBlock } from '@wagmi/core';

export const isAdapterBridge = (adapterType: string) => {
  return adapterType === 'bridge' || adapterType === '#_bridge';
};

/**
 * Find the block number by timestamp. Uses binary search to find the block number.
 * @param timestamp
 * @param chainId
 * @param client
 * @returns blockNumber
 */
export const findBlockByTimestamp = async (timestamp: bigint, chainId: number, config: Config): Promise<bigint> => {
  const latestBlock = await getBlock(config, {
    chainId: chainId,
  });

  let left = 0n;
  let right = latestBlock.number;

  while (left < right) {
    const mid = (left + right) / 2n;
    const block = await getBlock(config, {
      chainId: chainId,
      blockNumber: BigInt(mid),
    });

    if (block.timestamp < timestamp) {
      left = mid + 1n;
    } else {
      right = mid;
    }

    // wait for 2 seconds to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return left;
};
