import { AdapterIdParamsResponse, ComposeCalldataResponse } from '@/types/intents';
import { useCallback, useEffect, useState } from 'react';
import { zeroAddress } from 'viem';
import useSendTransaction from './useSendTransaction';
import { getTransactionReceiptFromChain } from '@/lib/getTransactionFromChain';
import { ChainIds } from '@/constants/chains';

const useIntentTransactions = ({
  intentTransaction,
  chainId,
  onIntentTransactionComplete,
  onIntentTransactionError,
}: {
  intentTransaction: ComposeCalldataResponse | undefined;
  onIntentTransactionComplete?: (hash: string) => void;
  onIntentTransactionError?: (error: Error) => void;
  chainId: string;
}) => {
  const [step, setStep] = useState(0);
  const [txError, setTxError] = useState<Error | null>(null);
  const [transactions, setTransactions] = useState<string[]>([]);
  const { sendTransactionAsync, error } = useSendTransaction();
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  useEffect(() => {
    if (error) {
      setTxError(error);
    }
  }, [error]);
  useEffect(() => {
    setTxError(null);
    setStep(0);
  }, [intentTransaction]);

  const handleTransaction = useCallback(async () => {
    if (!intentTransaction) {
      throw new Error('No intent transaction');
    }

    setIsTransactionPending(true);

    const { calldata, from, gasLimit, gasPrice, to, value, prioritySteps } = intentTransaction;

    let txHash: string | undefined;

    try {
      if (prioritySteps.length > 0 && step < prioritySteps.length) {
        const txData = prioritySteps[step];
        const { hash } = await sendTransactionAsync({
          calldata: txData.data || '',
          chainId: chainId,
          from: from,
          to: txData.contractAddress || zeroAddress,
          value: txData.value || '0',
        }).catch((error) => {
          setTxError(error);
          return { data: undefined, hash: undefined };
        });

        txHash = hash;
      } else {
        const { hash } = await sendTransactionAsync({
          calldata,
          from,
          chainId,
          to,
          value: value.toString(),
        }).catch((error) => {
          setTxError(error);
          if (onIntentTransactionError) {
            onIntentTransactionError(error);
          }
          return { data: undefined, hash: undefined };
        });

        if (!hash) return;

        txHash = hash;

        if (onIntentTransactionComplete) onIntentTransactionComplete(txHash);
      }

      if (txHash) {
        await getTransactionReceiptFromChain({
          chainId: chainId as ChainIds,
          txHash,
        });

        setStep(step + 1);
        setTransactions((transactions) => [...transactions, txHash] as string[]);
      }

      return txHash;
    } catch (e) {
      console.error(e);
    } finally {
      setIsTransactionPending(false);
    }
  }, [chainId, intentTransaction, onIntentTransactionComplete, onIntentTransactionError, sendTransactionAsync, step]);

  return {
    handleTransaction,
    isTransactionPending: isTransactionPending,
    transactionError: txError,
    step,
    transactions,
  };
};

export default useIntentTransactions;
