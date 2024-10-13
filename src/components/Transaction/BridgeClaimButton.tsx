import React from 'react';
import { Button } from '../ui/button';
import { AdapterMapItem, BatchData } from '@/types';
import useSendTransaction from '@/hooks/useSendTransaction';
import { simulateContract } from '@wagmi/core';
import { wagmiConfig } from '@/context/WagmiContext';
import { decodeEventLog, encodeFunctionData, parseEventLogs, zeroAddress } from 'viem';
import { getTransactionReceiptFromChain } from '@/lib/getTransactionFromChain';
import { ChainIds, CHAINS } from '@/constants/chains';
import useSwitchChains from '@/hooks/useSwitchChain';
import { useWalletContext } from '@/context/WalletContext';
import { capitalized } from '@/lib/utils';

const BridgeClaimButton = ({
  bridgeData,
  l1TxHash,
  setClaimStatus,
}: {
  l1TxHash: string | undefined;
  bridgeData: AdapterMapItem;
  setClaimStatus: (status: 'success' | undefined) => void;
}) => {
  const { error, hash, isTransactionPending, sendTransactionAsync } = useSendTransaction();
  const { switchChain, currentChainId } = useWalletContext();

  const handleClaim = async () => {
    const { adapterId, sourceChainId, destChainId, adapterOptions } = bridgeData;

    if (destChainId !== '59144' || !l1TxHash) {
      return;
    }
    const LINEA_BRIDGE_ADDRESS = '0x508Ca82Df566dCD1B0DE8296e70a96332cD644ec';

    const l1Tx = await getTransactionReceiptFromChain({
      chainId: sourceChainId as ChainIds,
      txHash: l1TxHash,
    });

    const messageSentEvent = parseEventLogs({
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: 'address', name: '_from', type: 'address' },
            { indexed: true, internalType: 'address', name: '_to', type: 'address' },
            { indexed: false, internalType: 'uint256', name: '_fee', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: '_value', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: '_nonce', type: 'uint256' },
            { indexed: false, internalType: 'bytes', name: '_calldata', type: 'bytes' },
            { indexed: true, internalType: 'bytes32', name: '_messageHash', type: 'bytes32' },
          ],
          name: 'MessageSent',
          type: 'event',
        },
      ] as const,
      logs: l1Tx.logs,
      eventName: 'MessageSent',
    });

    const _from = messageSentEvent[0].args._from;
    const _to = messageSentEvent[0].args._to;
    const _fee = messageSentEvent[0].args._fee;
    const _value = messageSentEvent[0].args._value;
    const _nonce = messageSentEvent[0].args._nonce;
    const _calldata = messageSentEvent[0].args._calldata;

    const calldata = encodeFunctionData({
      abi: [
        {
          inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_fee', type: 'uint256' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'address payable', name: '_feeRecipient', type: 'address' },
            { internalType: 'bytes', name: '_calldata', type: 'bytes' },
            { internalType: 'uint256', name: '_nonce', type: 'uint256' },
          ],
          name: 'claimMessage',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      args: [_from, _to, _fee, _value, zeroAddress, _calldata, _nonce],

      functionName: 'claimMessage',
    });

    await sendTransactionAsync({
      chainId: destChainId,
      calldata: calldata,
      to: LINEA_BRIDGE_ADDRESS,
      value: '0x0',
    }).then((res) => {
      if (res.hash) {
        setClaimStatus('success');
      }
    });
  };

  if (!l1TxHash) {
    return null;
  }

  if (isTransactionPending) {
    return (
      <Button
        className='ml-auto mr-1 h-7 rounded-sm py-1 text-sm'
        disabled={true}
      >
        Claiming
      </Button>
    );
  }

  if (hash) {
    return (
      <Button
        className='mr-1text-sm ml-auto h-7 rounded-sm  py-1'
        disabled={true}
      >
        Claimed
      </Button>
    );
  }

  if (currentChainId !== bridgeData.destChainId) {
    return (
      <Button
        className='ml-auto mr-1 h-7 rounded-sm py-1 text-sm'
        onClick={() => switchChain(bridgeData.destChainId as ChainIds)}
      >
        {`Switch to ${bridgeData.destChainId === 'xLayer' ? 'X Layer' : capitalized(CHAINS[bridgeData.destChainId as ChainIds])} to claim`}
      </Button>
    );
  }

  return (
    <Button
      className='ml-auto mr-1 h-7 rounded-sm py-1 text-sm'
      onClick={handleClaim}
    >
      Claim
    </Button>
  );
};

export default BridgeClaimButton;
