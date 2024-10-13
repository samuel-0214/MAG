import { ChainIds } from '@/constants/chains';
import { wagmiConfig } from '@/context/WagmiContext';
import { getTransactionReceiptFromChain } from '@/lib/getTransactionFromChain';
import { BatchParams, BatchStatusData } from '@/types';
import { getBlock, getBlockNumber, getClient, getTransactionReceipt, readContract } from '@wagmi/core';
import { Log, parseEventLogs, TransactionReceipt } from 'viem';
import { getLogs } from 'viem/actions';
import { findBlockByTimestamp } from '../utils';

export const waitForLidoBridge = async ({
  batchAdapter,
  destChainId,
  sourceChainId,
  sourceTxHash,
}: BatchParams): Promise<BatchStatusData> => {
  const l2NetworkId = destChainId as '324' | '10' | '42161' | '5000' | '59144' | '8453' | '534351';
  const l2LidoBridgeAddress = L2_BRIDGE_ADDRESS[l2NetworkId];
  const l2LidoBridgeAbi = L2_BRIDGE_ABIS[l2NetworkId];
  const l1LidoBridgeAbi = L1_BRIDGE_ABIS[l2NetworkId];

  if (l2LidoBridgeAddress === undefined) throw new Error('L2 bridge address not found');

  const transaction = await getTransactionReceiptFromChain({
    chainId: sourceChainId as ChainIds,
    txHash: sourceTxHash,
  });

  const srcTxTimestamp = await getBlock(wagmiConfig, {
    chainId: Number(sourceChainId),
    blockNumber: transaction.blockNumber,
  }).then((block) => block.timestamp);

  if (l2NetworkId === '534351') {
    return new Promise((resolve) => {
      const checkTx = async () => {
        while (true) {
          const txs = await fetch(
            `https://sepolia-api-bridge-v2.scroll.io/api/txs?address=${l2LidoBridgeAddress}&page=${page}&page_size=10`,
          ).then((res) => res.json());

          const tx = txs.data.results.find((tx: any) => tx.hash === sourceTxHash);

          if (tx && tx.counterpart_chain_tx.hash) {
            clearInterval(checkInterval);
            resolve({
              status: 'successful',
              batchData: {
                srcTxHash: sourceTxHash,
                destTxHash: tx.counterpart_chain_tx.hash,
              },
              adapterStatuses: {},
            });
          } else {
            if (
              txs.data.results.length === 0 ||
              txs.data.results[txs.data.results.length - 1].block_timestamp < srcTxTimestamp
            ) {
              page = 1;
              break;
            } else {
              page++;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 5_000));
        }
      };

      let page = 1;
      checkTx();
      const checkInterval = setInterval(checkTx, 10_000);
    });
  }

  if (l2NetworkId === '59144') {
    const lineaL1bridgeAbi = [
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
    ] as const;

    const messageSentLogs = parseEventLogs({
      abi: lineaL1bridgeAbi,
      logs: transaction.logs,
      eventName: 'MessageSent',
    });

    const messageHash = messageSentLogs[0].args._messageHash;

    const lineaL2BridgeAbi = [
      {
        inputs: [{ internalType: 'bytes32', name: 'messageHash', type: 'bytes32' }],
        name: 'inboxL1L2MessageStatus',
        outputs: [{ internalType: 'uint256', name: 'messageStatus', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const bridgeTxData = await new Promise<'received' | 'successful'>((resolve) => {
      const checkMessage = async () => {
        const status = await readContract(wagmiConfig, {
          abi: lineaL2BridgeAbi,
          address: '0x508Ca82Df566dCD1B0DE8296e70a96332cD644ec',
          functionName: 'inboxL1L2MessageStatus',
          chainId: 59144,
          args: [messageHash],
        }).then((res: any) => res.toString());

        if (status === '1') {
          clearInterval(checkInterval);
          resolve('received');
        }
        if (status === '2') {
          clearInterval(checkInterval);
          resolve('successful');
        }
      };

      checkMessage();
      const checkInterval = setInterval(checkMessage, 10_000);
    });

    return {
      status: bridgeTxData,
      batchData: {
        srcTxHash: sourceTxHash,
        destTxHash: '',
      },
      adapterStatuses: {},
    };
  }

  if (!l2LidoBridgeAbi || !l1LidoBridgeAbi) {
    throw new Error('L2 or L1 bridge abi not found');
  }
  const l2Event = l2LidoBridgeAbi.success;

  const l1Logs = parseEventLogs({
    abi: [l1LidoBridgeAbi.success],
    logs: transaction.logs,
    eventName: l1LidoBridgeAbi.success.name,
  });

  const l1LidoEvent = l1Logs[0];

  const { recipient, amount } = getBridgeRecipientAndAmount(l1LidoEvent, l2NetworkId);

  // let startBlock = await findBlockByTimestamp(srcTxTimestamp, Number(destChainId), wagmiConfig);
  let startBlock: bigint = await fetch(`/api/get-block-by-timestamp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timestamp: srcTxTimestamp.toString(),
      chainId: destChainId,
    }),
    // mode: 'no-cors',
  })
    .then(async (data) => {
      const { height } = await data.json();
      return BigInt(height);
    })
    .catch(async (e) => {
      console.error('[LLAMA] Error fetching block', e);
      return await findBlockByTimestamp(srcTxTimestamp, Number(destChainId), wagmiConfig);
    });

  let endBlock: bigint = startBlock + 300n;

  const eventArgs = getL2EventArgs(l2NetworkId, recipient, String(amount));

  console.log('CANONICAL EventArgs', eventArgs);

  const bridgeTxData: TransactionReceipt = await new Promise((resolve) => {
    const checkEvents = async () => {
      try {
        const destClient = getClient(wagmiConfig, {
          chainId: Number(destChainId),
        });

        if (!destClient) throw new Error('Could not get destination client');

        const events = await getLogs(destClient, {
          args: eventArgs,
          fromBlock: startBlock,
          toBlock: endBlock,
          event: l2Event,
          address: l2LidoBridgeAddress as `0x${string}`,
        });

        if (events.length === 0) {
          console.log('No events found for', l2NetworkId, startBlock, endBlock);
        } else {
          console.log('Events found for', l2NetworkId, events.length);
          clearInterval(checkInterval);
          resolve(
            await getTransactionReceipt(wagmiConfig, {
              chainId: Number(destChainId),
              hash: events[0].transactionHash as `0x${string}`,
            }),
          );
        }

        const currentBlock = await getBlockNumber(wagmiConfig, { chainId: Number(destChainId) });
        if (endBlock > currentBlock) {
          endBlock = currentBlock;
          startBlock = currentBlock - 300n;
        } else {
          startBlock = endBlock;
          endBlock = endBlock + 300n;
        }
      } catch (e) {
        console.error('Error fetching events', e);
      }
    };

    checkEvents();
    const checkInterval = setInterval(checkEvents, 5_000);
  });

  return {
    status: 'successful',
    batchData: {
      srcTxHash: sourceTxHash,
      destTxHash: bridgeTxData.transactionHash,
    },
    adapterStatuses: {},
  };
};

export const getBridgeRecipientAndAmount = (event: Log, l2Network: string) => {
  let recipient: string;
  let amount: string;

  // @ts-ignore
  const args: any = event.args;
  switch (l2Network) {
    case '324':
      recipient = args.to;
      amount = args.amount;
      break;
    case '10':
      recipient = args._to;
      amount = args._amount;
      break;
    case '42161':
      recipient = args.to;
      amount = args.amount;
      break;
    case '5000':
      recipient = args._to;
      amount = args._amount;
      break;
    case '59144':
      recipient = args.recipient;
      amount = args.amount;
      break;
    case '8453':
      recipient = args._to;
      amount = args._amount;
      break;

    default:
      throw new Error('Invalid network');
  }
  return { recipient, amount };
};

const getL2EventArgs = (l2Network: string, recipient: string, amount: string) => {
  switch (l2Network) {
    case '324':
      return {
        to: recipient,
        amount,
      };
    case '10':
      return {
        _to: recipient,
        _amount: amount,
      };
    case '42161':
      return {
        to: recipient,
        amount,
      };
    case '5000':
      return {
        _to: recipient,
        _amount: amount,
      };
    case '59144':
      return {
        recipient,
        amount,
      };
    case '8453':
      return {
        _to: recipient,
        _amount: amount,
      };
    default:
      throw new Error('Invalid network');
  }
};

///// CONSTANTS AND ABIS /////

export const L1_BRIDGE_ADDRESS = {
  // zksync
  324: '0x41527B2d03844dB6b0945f25702cB958b6d55989',
  // op
  10: '0x76943C0D61395d8F2edF9060e1533529cAe05dE6',
  // arbitrum
  42161: '0x0F25c1DC2a9922304f2eac71DCa9B07E310e8E5a',
  // mantle
  5000: '0x2D001d79E5aF5F65a939781FE228B267a8Ed468B',
  // linea
  59144: '0x051F1D88f0aF5763fB888eC4378b4D8B29ea3319',
  // base
  8453: '0x9de443AdC5A411E83F1878Ef24C3F52C61571e72',
};

const L2_BRIDGE_ADDRESS: Record<string, string> = {
  // zksync
  324: '0xE1D6A50E7101c8f8db77352897Ee3f1AC53f782B',
  // op
  10: '0x8E01013243a96601a86eb3153F0d9Fa4fbFb6957',
  //  arbitrum
  42161: '0x07d4692291b9e30e326fd31706f686f83f331b82',
  // mantle
  5000: '0x9c46560D6209743968cC24150893631A39AfDe4d',
  // linea
  59144: '0x353012dc4a9A6cF55c941bADC267f82004A8ceB9',
  // base
  8453: '0xac9D11cD4D7eF6e54F14643a393F68Ca014287AB',
  // scrollSepolia
  534351: '0xd5808A8D0Ec8eae3929Bbc380e562649cDb957F0',
};

const L2_BRIDGE_ABIS = {
  // zksync
  324: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'l1Sender', type: 'address' },
        { indexed: true, internalType: 'address', name: 'l2Receiver', type: 'address' },
        { indexed: true, internalType: 'address', name: 'l2Token', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'FinalizeDeposit',
      type: 'event',
    },
  },
  // op
  10: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'DepositFinalized',
      type: 'event',
    },
    failure: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'DepositFailed',
      type: 'event',
    },
  },
  // arbitrum
  42161: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: 'from', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'DepositFinalized',
      type: 'event',
    },
  },
  // mantle
  5000: {
    success: {
      type: 'event',
      name: 'DepositFinalized',
      inputs: [
        { type: 'address', name: '_l1Token', internalType: 'address', indexed: true },
        { type: 'address', name: '_l2Token', internalType: 'address', indexed: true },
        { type: 'address', name: '_from', internalType: 'address', indexed: true },
        { type: 'address', name: '_to', internalType: 'address', indexed: false },
        { type: 'uint256', name: '_amount', internalType: 'uint256', indexed: false },
        { type: 'bytes', name: '_data', internalType: 'bytes', indexed: false },
      ],
      anonymous: false,
    },
    failure: {
      type: 'event',
      name: 'DepositFailed',
      inputs: [
        { type: 'address', name: '_l1Token', internalType: 'address', indexed: true },
        { type: 'address', name: '_l2Token', internalType: 'address', indexed: true },
        { type: 'address', name: '_from', internalType: 'address', indexed: true },
        { type: 'address', name: '_to', internalType: 'address', indexed: false },
        { type: 'uint256', name: '_amount', internalType: 'uint256', indexed: false },
        { type: 'bytes', name: '_data', internalType: 'bytes', indexed: false },
      ],
      anonymous: false,
    },
  },
  // linea
  59144: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'nativeToken', type: 'address' },
        { indexed: true, internalType: 'address', name: 'bridgedToken', type: 'address' },
        { indexed: true, internalType: 'uint256', name: 'amount', type: 'uint256' },
        { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
      ],
      name: 'BridgingFinalized',
      type: 'event',
    },
  },
  //   base
  8453: {
    failure: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'DepositFailed',
      type: 'event',
    },
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'DepositFinalized',
      type: 'event',
    },
  },
  // scrollSepolia
  534351: null,
} as const;

const L1_BRIDGE_ABIS = {
  // zkSync
  324: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'bytes32', name: 'l2DepositTxHash', type: 'bytes32' },
        { indexed: true, internalType: 'address', name: 'from', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: false, internalType: 'address', name: 'l1Token', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        { indexed: false, internalType: 'address', name: 'refundRecipient', type: 'address' },
      ],
      name: 'DepositInitiated',
      type: 'event',
    },
  },
  // op
  10: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'ERC20DepositInitiated',
      type: 'event',
    },
  },
  // arbitrum
  42161: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: 'address', name: 'l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: 'from', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: true, internalType: 'uint256', name: 'sequenceNumber', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'DepositInitiated',
      type: 'event',
    },
  },
  // mantle
  5000: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'ERC20DepositInitiated',
      type: 'event',
    },
  },
  // linea
  59144: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
        { indexed: true, internalType: 'address', name: 'token', type: 'address' },
        { indexed: true, internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'BridgingInitiated',
      type: 'event',
    },
  },
  // base
  8453: {
    success: {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: '_l1Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_l2Token', type: 'address' },
        { indexed: true, internalType: 'address', name: '_from', type: 'address' },
        { indexed: false, internalType: 'address', name: '_to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' },
        { indexed: false, internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'ERC20DepositInitiated',
      type: 'event',
    },
  },
  // scrollSepolia
  534351: null,
} as const;
