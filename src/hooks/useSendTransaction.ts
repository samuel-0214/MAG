import { NetworkType } from '@/constants/chains';
import { wagmiConfig } from '@/context/WagmiContext';
import { useWalletContext } from '@/context/WalletContext';
import { useMutation } from '@tanstack/react-query';
import { estimateGas } from '@wagmi/core';
import { useConnectors, useSendTransaction as useWagmiSendTransaction } from 'wagmi';

const useSendTransaction = () => {
  const { currentAccount, currentWallet } = useWalletContext();
  const connectors = useConnectors();
  const { sendTransactionAsync: sendWagmiTransactionAsync } = useWagmiSendTransaction();

  const {
    data: transactionData,
    mutateAsync: sendTransactionAsync,
    error,
    isPending,
    isIdle,
  } = useMutation({
    mutationKey: ['sendIntentTransaction', currentAccount, currentWallet, connectors],
    mutationFn: async ({
      chainId,
      to,
      value,
      calldata,
      from,
      gasLimit,
      gasPrice,
    }: {
      chainId: string;
      to: string;
      value: string;
      calldata: string;
      from?: string;
      gasLimit?: string;
      gasPrice?: string;
    }) => {
      if (!currentAccount) {
        throw new Error('No account connected');
      }
      if (!currentWallet) {
        throw new Error('No wallet connected');
      }
      if (from && currentAccount.address !== from) {
        throw new Error('Switch Account');
      }

      if (currentAccount.networkType === NetworkType.EVM) {
        const connector = connectors.find((c) => c.id === currentWallet.id);

        if (!connector) {
          throw new Error('No connector found');
        }
        const estimatedGas = await estimateGas(wagmiConfig, {
          to: to as `0x${string}`,
          value: BigInt(value),
          data: calldata as `0x${string}`,
          chainId: Number(chainId),
          account: (from || currentAccount.address) as `0x${string}`,
        });
        const txHash = await sendWagmiTransactionAsync({
          connector,
          chainId: Number(chainId),
          to: to as `0x${string}`,
          value: BigInt(value),
          data: calldata as `0x${string}`,

          account: (from || currentAccount.address) as `0x${string}`,
          gas: gasLimit ? BigInt(gasLimit) : estimatedGas + (estimatedGas / 100n) * 20n,
          gasPrice: gasPrice ? BigInt(gasPrice) : undefined,
        });

        // const tx = await waitForTransactionReceipt(wagmiConfig, {
        //   chainId: Number(chainId),
        //   hash: txHash as `0x${string}`,
        // }).catch((e) => {
        //   console.error('Error waiting for transaction', e);

        //   return getTransactionReceipt(wagmiConfig, {
        //     chainId: Number(chainId),
        //     hash: txHash as `0x${string}`,
        //   });
        // });

        return { hash: txHash };
      }

      throw new Error('Unsupported network');
    },
    onError: (error) => {
      console.error('Error sending transaction', error);
    },
    onSuccess: (transaction) => {
      console.log('Transaction sent', transaction);
    },
  });

  return {
    hash: transactionData?.hash,
    sendTransactionAsync,
    isTransactionPending: isPending,
    error,
  };
};

export default useSendTransaction;
