import { isTokenETH } from '@/lib/utils';
import { PrioritySteps } from '@/types/intents';
import { useMemo } from 'react';
import { encodeFunctionData, erc20Abi, parseUnits, zeroAddress } from 'viem';
import { useBalance, useReadContract } from 'wagmi';

const useTokenAllowance = ({
  token,
  spender,
  userAddress,
  sourceChain,
  amount,
}: {
  token:
    | {
        address: string;
        decimals: number;
        chainId: number;
      }
    | undefined;
  spender: string | undefined;
  userAddress: string | undefined;
  sourceChain: number;
  amount: string;
}) => {
  const isETH = useMemo(() => isTokenETH(token?.address || ''), [token]);

  const { data: allowance, isLoading: isAllowanceLoading } = useReadContract({
    abi: erc20Abi,
    address: token?.address as `0x${string}`,
    functionName: 'allowance',
    args: [userAddress, spender] as readonly [`0x${string}`, `0x${string}`],
    chainId: sourceChain,
    query: {
      enabled: Boolean(token?.address && spender && userAddress),
    },
  });
  const needApproval = useMemo(() => {
    if (isETH) return false;
    if (amount === '') return false;
    if (token?.address === undefined) return false;

    if (allowance === undefined) return false;
    if (isAllowanceLoading) return true;

    return allowance < parseUnits(amount.toString(), token?.decimals || 18);
  }, [allowance, amount, isAllowanceLoading, isETH, token?.address, token?.decimals]);

  const prioritySteps = useMemo(() => {
    if (needApproval) {
      return [
        {
          contractAddress: token?.address || zeroAddress,
          instructionData: 'Approve token',
          instructionTitle: 'Approve',
          value: '0',
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender as `0x`, BigInt(amount)],
          }),
        },
      ] as PrioritySteps[];
    } else {
      return [];
    }
  }, [amount, needApproval, spender, token?.address]);

  return {
    allowance,
    isETH,
    needApproval,
    prioritySteps,
  };
};

export default useTokenAllowance;
