import { NetworkType } from '@/constants/chains';
import { useTronContext } from '@/context/TronContext';
import { getChainType } from '@/lib/utils';
import { useSwitchChain } from 'wagmi';

const useSwitchChains = () => {
  const { switchChain } = useSwitchChain();
  const { tronAdapter } = useTronContext();

  const switchChains = async (chainId: string) => {
    const chainType = getChainType(chainId);
    if (chainType === NetworkType.EVM) {
      switchChain({
        chainId: Number(chainId),
      });
    }
    if (chainType === NetworkType.TRON) {
      // tronAdapter.switchChain(chainId)
    }
  };

  return switchChains;
};

export default useSwitchChains;
