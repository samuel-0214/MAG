import { AdapterMap } from '.';

export interface TokenData {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  isWrappedAsset?: boolean;
}

export interface AdapterIdParamsResponse {
  adapterId: string;
  adapterType: string;
  sourceChainId: string;
  destChainId: string;
  adapterOptions?: {
    srcToken: TokenData;
    amountIn: string;
    amountOut: string;
    destToken: TokenData;
    receiverAddress: string;
    data?: any;
  };
  adapters?: Array<AdapterIdParamsResponse>;
}
export interface AdapterQuotationResponse extends AdapterQuotationApiResponse {
  adapterId: string;
  srcToken: string;
  destToken: string;
  adapters?: Array<AdapterQuotationResponse>;
  bridgeFee?: BridgeFee;
  estimatedTime: number;
}

export interface AdapterQuotationApiResponse {
  amountSent: string | number;
  amountReceived: string | number;
  amountReceivedInEther: string | number;
  exchangeRate?: string | number | BridgeFee;
  data?: any;
  estimatedTime?: number;
  slippageTolerance?: number;
}

export interface BridgeFee {
  amount: string;
  decimals: number;
  symbol: string;
}
export interface ProtocolParamsResponse {
  quotationType: string;
  sourceTokens: Array<TokenData>;
  amount: Array<number>;
  sourceChainId: number;
  destinationChainId: number;
  destinationToken: TokenData;
  adapters: Array<AdapterIdParamsResponse>;
  quote: Array<AdapterQuotationResponse>;
  clientAddress: string;
  senderAddress: string;
  estimatedTime?: number;
}

export interface ProtocolRequestBody {
  ReceiverAddress: string;
  SourceTokens: Array<{
    chainId: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    resourceID: string;
    isMintable: boolean;
    isWrappedAsset: boolean;
  }>;
  Amount: number[];
  SourceChainId: number;
  Protocol: Array<{
    protocolId: string;
    chainId: number;
    action: string;
    poolId: string;
  }>;
}

export enum PoolProviders {
  NONE = 'none',
  LSD_LLAMA = 'lsd_llama',
}

export interface PoolData {
  id: string;
  name: string;
  protocolId: string;
  chain: string;
  dataProvider: PoolProviders;
  metadata: {
    llamaId: string;
    protocolLink: string;
    url: string;
  };
  risk: number;
  active: boolean;
  underlyingTokens: Record<string, TokenData>;

  data: {
    apy: number;
    apyMean30d: number;
    tvlUsd: number;
  };
}

export interface ProtocolData {
  id: string;
  name: string;
  protocolId: string;
  chain: string;
  data: {
    apy: number;
    apyMean30d: number;
    tvlUsd: number;
  };
  category: string;
}

export interface ComposeCalldataResponse {
  trnxId: string;
  gasLimit?: string;
  gasPrice?: string;
  calldata: string;
  to: string;
  from: string;
  value: Array<number | string>;
  data?: any;
  prioritySteps: Array<PrioritySteps>;
}

export interface FeeQuoteCalldataResponse {
  totalFee: string;
  token: {
    chainId: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  chain: number;
  fees: {
    fee: string;
    recipient: string;
    decimals: number;
    symbol: string;
    tokenAddress: string;
    chainId: number;
    name: string;
    adapter: string;
  }[];
}

export interface PrioritySteps {
  contractAddress?: string;
  instructionData: string;
  instructionTitle?: string;
  value: string;
  data?: string;
}

export interface TransactionDetails {
  transactionId: string;
  transactionStatus: string;
  gasFee: string;
  transactionHash: string;
  adapters: AdapterMap;
  sourceTokens: Array<TokenData>;
  sourceAmount: Array<number>;
  senderAddress: string;
  receiverAddress: string;
  sourceChainId: string;
  destinationChainId: string;
  transactionCreationTime: string;
  transactionCompletionTime: string;
  transactionUpdateTime: string;
}

export interface RNSData {
  msg: string;
  resolvedData: string;
}
