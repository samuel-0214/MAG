import { Transaction, TransactionReceipt } from 'viem';
import { AdapterIdParamsResponse } from './intents';

export type GetAdapterStatusParams = {
  transaction: TransactionReceipt;
  adapter: AdapterIdParamsResponse;
};

export type AdapterStatus = 'successful' | 'failed' | 'loading' | 'error';

export type AdapterMapItem = Omit<AdapterIdParamsResponse, 'adapters'> & {
  adapters: AdapterMapItem[];
  adapterIndices: string[];
  adapterIndex: string;
};
export type AdapterMap = Record<string, AdapterMapItem>;

export type BatchStatus = 'successful' | 'src_failed' | 'dest_failed' | 'loading' | 'received' | 'error' | 'failed';

export type BatchParams = {
  sourceChainId: string;
  destChainId: string;
  sourceTxHash: string;
  batchAdapter: AdapterMapItem;
};

export type BatchData = {
  srcTxHash: string;
  destTxHash: string;
};

export interface Batch {
  id: string;
  batch: Array<string> | undefined; // nested batches
}

export type BatchStatusData = {
  status: BatchStatus;
  batchData: BatchData;
  adapterStatuses: Record<string, AdapterStatus>;
};

export type BatchStatusMapItem = {
  status: BatchStatus;
  data: Partial<BatchData>;
};

export type BatchStatusMap = Record<string, BatchStatusMapItem>;

export type IntentTxData = {
  sourceTxData: {
    chainId: string;
    to: string;
    from: string;
    value: string;
    data: string;
    hash: string;
    transaction: Transaction | undefined;
    txReceipt: TransactionReceipt | undefined;
  };
  adapters: Array<AdapterMapItem>;
  adapterMap: AdapterMap;
  batch: Batch[];
};

export interface TransactionStatusContextState extends Partial<IntentTxData> {
  adapterStatuses: BatchStatusMap;
  // adapterStatuses: Record<string, AdapterStatus>;
  isIntentTxDataLoading: boolean | undefined;
  intentTxDataError: Error | null;
}

export type BatchQueryCallback = (
  batchId: string,
  status: BatchStatus,
  data: Partial<BatchData>,
  adapterStatuses: { [key in string]: AdapterStatus }, //Record<string, AdapterStatus>,
) => void;
