import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CHAINS, ChainIds } from '@/constants/chains';
import { formatNumber } from '@/lib/formatNumber';
import { cn, getTokenLogoURI } from '@/lib/utils';
import { Button } from './ui/button';
import { TokenData } from '@/types/intents';

const AmountInput = ({
  sourceChainId,
  sourceToken,
  tokenBalance,
  stakeAmount,
  setStakeAmount,
  handleStakeAmountChange,
  disabled,
  label,
  isLoading,
}: {
  sourceChainId: ChainIds;
  sourceToken: TokenData | undefined;
  tokenBalance: any;
  stakeAmount: string;
  setStakeAmount: any;
  label?: string;
  handleStakeAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) => {
  return (
    <div className='grid w-full items-center gap-1.5'>
      <div className='flex justify-between'>
        <Label
          className={cn('font-normal', disabled ? 'opacity-50' : '')}
          htmlFor='stakeAmount'
        >
          {label || 'Amount'}
        </Label>
        <span
          onClick={() => setStakeAmount(tokenBalance?.formatted || '')}
          className={cn(
            'text-black-muted text-xs font-normal',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer ',
          )}
        >
          Balance: {formatNumber(Number(tokenBalance?.formatted))}
        </span>
      </div>
      <div className='relative'>
        <Input
          disabled={disabled || isLoading}
          type='string'
          id='stakeAmount'
          placeholder='0.0'
          className={cn('h-12', isLoading ? 'animate-pulse' : '')}
          value={stakeAmount}
          onChange={handleStakeAmountChange}
          autoComplete='off'
        />

        <Button
          disabled
          variant={'outline'}
          className='absolute right-1 top-1/2 flex -translate-y-1/2 cursor-pointer items-center gap-2'
        >
          {sourceToken ? (
            <img
              loading='eager'
              src={getTokenLogoURI(sourceToken?.address, CHAINS[sourceChainId])}
              alt={''}
              width={20}
              height={20}
              className='inline-block h-5 w-5 rounded-full bg-white'
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = '/images/icons/unknown.png';
              }}
            />
          ) : (
            <div className='h-5 w-5 rounded-full border border-border bg-neutral-900'></div>
          )}

          <span className='text-neutral-200'>{sourceToken?.symbol || 'Select token'}</span>
        </Button>
      </div>
    </div>
  );
};

export default AmountInput;
