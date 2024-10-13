import { gql } from 'graphql-tag';

export const FIND_NITRO_TRANSACTIONS_BY_FILTER = gql`
  query FindNitroTransactionsByFilter($where: NitroTransactionFilter) {
    findNitroTransactionsByFilter(where: $where) {
      data {
        dest_chain_id
        dest_amount
        src_amount
        src_address
        dest_address
        src_chain_id
        dest_tx_hash
        receiver_address
      }
    }
  }
`;
