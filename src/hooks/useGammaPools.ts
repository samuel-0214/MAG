// useGammaPools.ts
import { ChainIds } from '@/constants/chains';
import { TOKEN_SYMBOL_MAP } from '@/constants/tokens';
import { ApiResponse, GammaPool, Pool } from '@/types/lynex';
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';

const fetchGammaPools = async ({ queryKey }: QueryFunctionContext): Promise<GammaPool[]> => {
  const sourceChainId = queryKey[1] as string;
  const response = await fetch('https://api.lynex.fi/api/v1/fusions');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const { success, data }: ApiResponse = await response.json();

  if (!success) {
    throw new Error('API response was not successful');
  }

  const tokenAddresses = Object.values(TOKEN_SYMBOL_MAP[sourceChainId] || {}).map((token) =>
    token.address.toLowerCase(),
  );

  // Filter for gamma correlated and gamma narrow and token addresses
  const gammaPools = data.filter(
    (pool) =>
      pool.isGamma &&
      (pool.title === 'Gamma Correlated' || pool.title === 'Gamma Narrow') &&
      tokenAddresses.includes(pool.token0.address.toLowerCase()) &&
      tokenAddresses.includes(pool.token1.address.toLowerCase()),
  );

  // Extract only the required fields
  return gammaPools.map((pool) => ({
    tvl: pool.gauge.tvl,
    address: pool.address,
    apr: pool.gauge.apr,
    token0Address: pool.token0.address,
    token1Address: pool.token1.address,
    symbol: pool.symbol,
    type: pool.type,
    isGamma: pool.isGamma,
    title: pool.title,
  }));
};

const useGammaPools = (sourceChainId: ChainIds) => {
  return useQuery<GammaPool[], Error>({
    queryKey: ['gammaPools', sourceChainId],
    queryFn: fetchGammaPools,
    refetchInterval: 45_000, // Refetch every 45 seconds
  });
};

export default useGammaPools;
