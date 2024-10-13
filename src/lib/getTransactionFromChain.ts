import { ChainIds } from '@/constants/chains';
import { CHAINS_DATA } from '@/constants/chains/list';
import { wagmiConfig } from '@/context/WagmiContext';
import { getTransaction, getTransactionReceipt, waitForTransactionReceipt } from '@wagmi/core';
import { Transaction } from 'viem';

export const getTransactionFromChain = async ({
  chainId,
  txHash,
}: {
  chainId: ChainIds;
  txHash: string;
}): Promise<Transaction | undefined> => {
  if (CHAINS_DATA[chainId].type === 'evm' || !CHAINS_DATA[chainId].type) {
    try {
      const tx = await getTransaction(wagmiConfig, {
        chainId: Number(chainId),
        hash: txHash as `0x${string}`,
      });
      return tx;
    } catch (error) {
      await waitForTransactionReceipt(wagmiConfig, {
        chainId: Number(chainId),
        hash: txHash as `0x${string}`,
        timeout: 1000 * 60 * 2, // 2 minutes
      });

      const tx = await getTransaction(wagmiConfig, {
        chainId: Number(chainId),
        hash: txHash as `0x${string}`,
      });

      return tx;
    }
  } else {
    // TODO: Add support for other chain types
    throw new Error('Chain type not supported');
  }
};

export const getTransactionReceiptFromChain = async ({ chainId, txHash }: { chainId: ChainIds; txHash: string }) => {
  if (CHAINS_DATA[chainId].type === 'evm' || !CHAINS_DATA[chainId].type) {
    try {
      const tx = await getTransactionReceipt(wagmiConfig, {
        chainId: Number(chainId),
        hash: txHash as `0x${string}`,
      });
      return tx;
    } catch (error) {
      return waitForTransactionReceipt(wagmiConfig, {
        chainId: Number(chainId),
        hash: txHash as `0x${string}`,
        timeout: 1000 * 60 * 2, // 2 minutes
      });
    }
  } else {
    // TODO: Add support for other chain types
    throw new Error('Chain type not supported');
  }
};
