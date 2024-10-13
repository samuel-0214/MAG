import { useQuery } from '@tanstack/react-query';
import { getBalance } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { CHAIN_TOKEN_STETH_ADDRESS_MAP } from '@/constants/tokens';
import { isTokenETH } from '@/lib/utils';
import { ChainIds } from '@/constants/chains';

const useMultipleTokenData = ({ chainIds, account }: { chainIds: ChainIds[]; account: string }) => {
  const config = useConfig();
  const {
    data: tokenBalances,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tokenBalances', chainIds, account],
    queryFn: async () => {
      try {
        if (account === '') return 0;
        const balancePromises = chainIds.map(async (chainId) => {
          if (!CHAIN_TOKEN_STETH_ADDRESS_MAP[chainId]) throw new Error('Address is required');
          const tokenAddress = CHAIN_TOKEN_STETH_ADDRESS_MAP[chainId];

          if (isTokenETH(tokenAddress)) return 0; // Handle ETH case separately

          const balance = await getBalance(config, {
            chainId: Number(chainId),
            address: account as `0x${string}`,
            token: CHAIN_TOKEN_STETH_ADDRESS_MAP[chainId] as `0x${string}`,
          });
          return parseFloat(balance.formatted);
        });

        const balances = await Promise.all(balancePromises);
        const totalTokenBalance = balances.reduce((acc, curr) => acc + curr, 0);
        return totalTokenBalance;
      } catch (error: any) {
        throw new Error(`Error fetching token balances: ${error.message}`);
      }
    },
  });

  return {
    tokenBalances: tokenBalances || 0,
    isTokenBalancesLoading: isLoading,
    tokenBalancesError: isError,
  };
};

export default useMultipleTokenData;
