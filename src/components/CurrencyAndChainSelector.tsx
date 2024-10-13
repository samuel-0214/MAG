import { Label } from '@/components/ui/label';

import { ChainIds } from '@/constants/chains';
import { MAINNET_CHAIN_IDS, MAINNET_SUPPORTED_CHAIN_IDS, TESTNET_CHAIN_IDS } from '@/constants/chains/list';
import { TOKEN_SYMBOL_MAP, Token } from '@/constants/tokens';
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import NetworkSelector from './NetworkSelector';
import { TokenSelector } from './TokenSelector';
import { useWalletContext } from '@/context/WalletContext';

const getChains = (testnet: boolean, filters?: ChainIds[]) => {
  if (testnet) {
    return Object.values(TESTNET_CHAIN_IDS)
      .filter((chainId) => (filters ? filters.includes(chainId) : true))
      .sort((c1, c2) => (c1[0] < c2[0] ? -1 : 1));
  }
  return Object.values(MAINNET_SUPPORTED_CHAIN_IDS)
    .filter((chainId) => (filters ? filters.includes(chainId) : true))
    .sort((c1, c2) => (c1[0] < c2[0] ? -1 : 1));
};

const CurrencyAndChainSelector = ({
  sourceChainId,
  setSourceChainId,
  sourceToken,
  setSourceToken,
  testnet,
  filterChains,
  networkLabel = 'Select Network',
  tokenLabel = 'Select Token',
}: {
  sourceChainId: ChainIds;
  setSourceChainId: (c: ChainIds) => void;
  sourceToken: Token | undefined;
  setSourceToken: Dispatch<SetStateAction<Token | undefined>>;
  testnet: boolean;
  filterChains?: ChainIds[];
  networkLabel?: string;
  tokenLabel?: string;
}) => {
  const { currentChainId } = useWalletContext();

  const allowedChains = useMemo(() => {
    return getChains(testnet, filterChains);
  }, [testnet, filterChains]);

  useEffect(() => {
    if (currentChainId && allowedChains.includes(currentChainId as ChainIds)) {
      setSourceChainId(currentChainId as ChainIds);
    }
  }, [currentChainId, allowedChains, setSourceChainId]);

  const tokenList = useMemo(() => {
    if (!sourceChainId) return [];
    if (!TOKEN_SYMBOL_MAP[sourceChainId]) return [];

    return Object.values(TOKEN_SYMBOL_MAP[sourceChainId]);
  }, [sourceChainId]);

  return (
    <div className='grid grid-cols-1 gap-x-4 gap-y-1.5 xs:grid-cols-2'>
      <Label
        className='order-1 font-normal'
        htmlFor=''
      >
        {/* Stake from */}
        {networkLabel}
      </Label>
      <Label
        className='order-3 font-normal xs:order-2'
        htmlFor=''
      >
        {/* Stake on */}
        {tokenLabel}
      </Label>

      <div className='order-2 mb-2.5 flex w-full xs:order-3 xs:mb-0'>
        <NetworkSelector
          currentChainId={sourceChainId}
          setChain={setSourceChainId}
          chains={allowedChains}
        />
      </div>

      <div className='order-4 flex w-full'>
        <TokenSelector
          setSourceToken={setSourceToken}
          sourceChainId={sourceChainId}
          sourceToken={sourceToken}
          tokenList={tokenList}
        />
      </div>
    </div>
  );
};

export default CurrencyAndChainSelector;
