export interface NitroTransactionReceipt {
  dest_timestamp: number;
  dest_tx_hash: string;
  status: string;
  dest_address: string;
  dest_amount: string;
  dest_symbol: string;
  fee_amount: string;
  fee_address: string;
  fee_symbol: string;
  recipient_address: string;
  deposit_id: string;
  src_amount: string;
  src_timestamp: number;
  src_tx_hash: string;
  src_stable_address: string;
}

export interface NitroTransactions {
  dest_chain_id: string;
  dest_amount: string;
  src_amount: string;
  src_address: string;
  dest_address: string;
  src_chain_id: string;
  dest_tx_hash: string;
  receiver_address: string;
}

export const BatchTransactionAdapterAddress = '0x4D9733ca83610E1343Ed2581d1779f294638BB33';
export const NITRO_EXPLORER = 'https://explorer.routernitro.com';
