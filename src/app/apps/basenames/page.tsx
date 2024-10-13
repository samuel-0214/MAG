'use client';

import AmountInput from '@/components/AmountInput';
import CurrencyAndChainSelector from '@/components/CurrencyAndChainSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { INTENTS_BASE_URI } from '@/constants';
import { ChainIds } from '@/constants/chains';
import { TOKEN_MAP, Token } from '@/constants/tokens';
import { useWalletContext } from '@/context/WalletContext';
import useIntentTransactions from '@/hooks/useIntentCalldata';
import useTokenData from '@/hooks/useTokenData';
import { getSecondsToDurationString } from '@/lib/duration';
import { formatNumber } from '@/lib/formatNumber';
import { NATIVE, cn, updateDbTransaction } from '@/lib/utils';
import { ComposeCalldataResponse, FeeQuoteCalldataResponse, ProtocolParamsResponse } from '@/types/intents';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits, zeroAddress } from 'viem';

const TxButtons = dynamic(() => import('@/components/TxButton'), {
  ssr: false,
  loading: () => (
    <Button
      className='w-full'
      disabled
    >
      Loading...
    </Button>
  ),
});

const Page = () => {
  const router = useRouter();

  const [sourceChainId, setSourceChainId] = useState<ChainIds>('137');
  const [sourceToken, setSourceToken] = useState<Token | undefined>();

  //   const [stakeAmount, setStakeAmount] = useState<string>('');
  //   const [debouncedStakeAmount] = useDebounceValue(stakeAmount, 1000);

  const [baseName, setBaseName] = useState<string>('');
  // duration in years
  const [duration, setDuration] = useState<number>(1);

  const { currentAccount, currentChainId } = useWalletContext();

  useEffect(() => {
    setSourceToken(TOKEN_MAP[sourceChainId][NATIVE]);
  }, [sourceChainId]);

  const { tokenData, tokenBalance } = useTokenData({
    account: currentAccount?.address || '',
    chainId: sourceChainId,
    tokenAddress: sourceToken?.address || '',
  });

  const handleBaseNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseName(e.target.value.trim());
  }, []);

  const baseNameError = useMemo(() => {
    // if base names include any special characters or non-alphanumeric characters
    const specialChars = /[^a-zA-Z0-9]/;

    if (specialChars.test(baseName)) return new Error('Basename cannot include special characters');

    return baseName.includes(' ') ? new Error('Basename cannot include spaces') : undefined;
  }, [baseName]);

  const { data: ethPrice, isLoading: isEthPriceLoading } = useQuery({
    queryKey: ['eth price'],
    queryFn: async () => {
      return await fetch(`https://price-api.crypto.com/price/v1/token-price/ethereum`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json().then((data) => data.usd_price));
    },
  });

  const {
    data: protocolQuote,
    isLoading: isProtocolQuoteLoading,
    isFetching: isProtocolQuoteFetching,
    error: protocolQuoteError,
  } = useQuery({
    queryKey: [
      'basenames protocol quote',
      sourceChainId,
      sourceToken,
      currentAccount,
      currentAccount?.address,
      sourceToken?.address,
      sourceToken?.symbol,
      sourceToken?.decimals,
    ],
    queryFn: async ({ signal }) => {
      if (!sourceToken) {
        throw new Error('Incomplete parameters');
      }

      // fetch quote
      const data = await fetch(INTENTS_BASE_URI + '/router-intent/protocol/get-protocol-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ReceiverAddress: currentAccount?.address || zeroAddress,
          SourceTokens: [
            {
              chainId: sourceChainId,
              address: sourceToken?.address,
              symbol: sourceToken?.symbol,
              decimals: sourceToken?.decimals,
            },
          ],
          SourceChainId: Number(sourceChainId),
          Protocol: [
            {
              action: 'stake',
            },
          ],
        }),
        signal,
      }).then((res) => res.json());

      if (!data) {
        throw new Error('No data');
      }
      if (data?.Errors?.length > 0) {
        throw new Error(data.Errors[0].Message.title);
      }

      return data.PayLoad as ProtocolParamsResponse;
    },
    enabled: !!(sourceToken && sourceChainId),
    staleTime: 45_000, // 30 seconds
    retry: false,
  });

  const {
    data: feeQuote,
    isLoading: isfeeQuoteLoading,
    error: feeQuoteError,
  } = useQuery({
    queryKey: ['basenames fee quote', protocolQuote],
    queryFn: async () => {
      if (!protocolQuote) {
        throw new Error('No data');
      }
      // fetch calldata
      const data = await fetch(INTENTS_BASE_URI + '/router-intent/adapter/get-fee-params-from-adapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolQuote),
      }).then((res) => res.json());

      if (!data) {
        throw new Error('No data');
      }
      if (data?.Errors?.length > 0) {
        throw new Error(data.Errors[0].Message.title);
      }

      return data.PayLoad as FeeQuoteCalldataResponse;
    },
    enabled: !!(protocolQuote && !isProtocolQuoteLoading),
  });

  const balanceError = useMemo(() => {
    return !isProtocolQuoteLoading &&
      protocolQuote &&
      Number(protocolQuote.quote[protocolQuote.quote.length - 1].amountSent) > Number(tokenBalance?.formatted)
      ? new Error('Insufficient Funds')
      : undefined;
  }, [isProtocolQuoteLoading, protocolQuote, tokenBalance?.formatted]);

  const {
    data: calldataQuote,
    isLoading: isCallDataQuoteLoading,
    error: calldataQuoteError,
  } = useQuery({
    queryKey: ['basenames calldata quote', protocolQuote],
    queryFn: async () => {
      if (!protocolQuote) {
        throw new Error('No data');
      }
      // fetch calldata
      const data = await fetch(INTENTS_BASE_URI + '/router-intent/adapter/compose-adapter-calldata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolQuote),
      }).then((res) => res.json());

      if (!data) {
        throw new Error('No data');
      }
      if (data?.Errors?.length > 0) {
        throw new Error(data.Errors[0].Message.title);
      }

      return data.PayLoad as ComposeCalldataResponse;
    },
    enabled: !!(protocolQuote && !isProtocolQuoteLoading && !balanceError),
  });

  const bridgeFee = useMemo(() => {
    if (!feeQuote) return 0;

    const quoteBridgeFees = feeQuote?.token;
    const feeAmount = feeQuote?.totalFee;

    if (!feeAmount || !quoteBridgeFees) return 0;

    let bridgeFee = 0,
      bridgeFeeReserve,
      bridgeToken;

    bridgeFeeReserve = Number(formatUnits(BigInt(feeAmount), quoteBridgeFees?.decimals || 18));
    bridgeToken = quoteBridgeFees?.symbol;
    bridgeFee = bridgeToken === 'ETH' || bridgeToken === 'WETH' ? bridgeFeeReserve * ethPrice : bridgeFeeReserve;

    return bridgeFee;
  }, [ethPrice, feeQuote]);

  const clearInputs = useCallback(() => {}, []);

  const onIntentTransactionComplete = useCallback(
    (txHash: string) => {
      updateDbTransaction({
        id: calldataQuote?.trnxId!,
        hash: txHash,
        status: 'COMPLETED',
        gasFee: '0',
      }).then(() => {
        clearInputs();
        // open tx page
        router.push(`/tx/${txHash}`);
      });
    },
    [calldataQuote?.trnxId, clearInputs, router],
  );
  const onIntentTransactionError = useCallback((error: Error) => {
    console.error('Error', error);
  }, []);

  const { handleTransaction, isTransactionPending, transactionError, step } = useIntentTransactions({
    intentTransaction: calldataQuote,
    chainId: sourceChainId,
    onIntentTransactionComplete,
    onIntentTransactionError,
  });

  return (
    <>
      <div className='mx-auto flex w-full max-w-[50ch] flex-col gap-2'>
        <Card className='rounded-2xl'>
          <CardHeader>
            <CardTitle className='text-3xl text-blue-500'>Get Your Basenames</CardTitle>
            <CardDescription>Powered by Router Intents</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='grid w-full items-center gap-1.5'>
              <div className='flex justify-between'>
                <Label
                  className={cn('font-normal')}
                  htmlFor='basename'
                >
                  Find your Basename
                </Label>

                {baseNameError && <span className='text-sm leading-none text-red-500'>{baseNameError.message}</span>}
              </div>
              <Input
                type='text'
                value={baseName}
                className={cn(baseNameError ? 'ring-2  ring-red-500' : '')}
                onChange={handleBaseNameChange}
              />
            </div>

            {/* duration in years */}
            <div className='grid w-full items-center gap-1.5'>
              <div className='flex justify-between'>
                <Label
                  className={cn('font-normal')}
                  htmlFor='duration'
                >
                  Reserve Basename for
                </Label>
              </div>

              {/* plus, minus buttons around the current value */}
              <div className='flex gap-2'>
                <Button variant='outline'>-</Button>
                <Input />
                <Button variant='outline'>+</Button>
              </div>
            </div>

            <Separator className='my-4' />
            <CurrencyAndChainSelector
              setSourceChainId={setSourceChainId}
              setSourceToken={setSourceToken}
              sourceChainId={sourceChainId}
              sourceToken={sourceToken}
              testnet={false}
              networkLabel='Pay from'
              tokenLabel='Pay with'
            />

            <AmountInput
              handleStakeAmountChange={() => {}}
              disabled={false}
              setStakeAmount={() => {}}
              sourceChainId={sourceChainId}
              sourceToken={sourceToken}
              stakeAmount={'12'}
              tokenBalance={tokenBalance}
            />
          </CardContent>

          <CardFooter className='mt-8 flex flex-col gap-4'>
            <div className='grid w-full grid-cols-2 gap-2 rounded-xl border border-neutral-800 bg-background/25 p-2'>
              <div className={'flex flex-col gap-1 rounded-md bg-background/40 p-2 text-neutral-400'}>
                <span className='text-xs'>ETA</span>
                <span
                  className={cn(
                    'text-base font-medium text-neutral-300',
                    isProtocolQuoteLoading ? 'animate-pulse rounded-xs bg-foreground/10 text-transparent' : '',
                  )}
                >
                  {isProtocolQuoteLoading
                    ? 'Loading...'
                    : protocolQuote
                      ? getSecondsToDurationString(protocolQuote?.estimatedTime || 0)
                      : '--'}
                </span>
              </div>
              <div className={'flex flex-col gap-1 rounded-md bg-background/40 p-2 text-neutral-400'}>
                <span className='text-xs'>Total Fee</span>
                <span
                  className={cn(
                    'text-base font-medium text-neutral-300',
                    isProtocolQuoteLoading || isfeeQuoteLoading
                      ? 'animate-pulse rounded-xs bg-foreground/10 text-transparent'
                      : '',
                  )}
                >
                  $ {isProtocolQuoteLoading || isfeeQuoteLoading ? 'Loading...' : formatNumber(bridgeFee)}
                </span>
              </div>
            </div>

            <TxButtons
              className='w-full'
              chainId={sourceChainId}
              label={
                calldataQuote?.prioritySteps[step]
                  ? calldataQuote?.prioritySteps[step].instructionTitle || 'Transact'
                  : 'Stake'
              }
              error={calldataQuoteError || transactionError || protocolQuoteError || balanceError}
              handleComplete={() => {}}
              handleTransaction={handleTransaction}
              isDisabled={
                !protocolQuote ||
                !calldataQuote ||
                isProtocolQuoteLoading ||
                isCallDataQuoteLoading ||
                isTransactionPending
              }
              isLoading={isCallDataQuoteLoading || isProtocolQuoteFetching}
              isSubmitting={isTransactionPending}
              success={false}
              errorLabel={
                protocolQuoteError
                  ? protocolQuoteError.message
                  : balanceError
                    ? balanceError.message
                    : 'Something went wrong'
              }
              loadingLabel={
                isCallDataQuoteLoading
                  ? 'Building Transaction'
                  : isProtocolQuoteLoading || isProtocolQuoteFetching
                    ? 'Fetching Quote'
                    : undefined
              }
              successLabel='Staked Successfully'
            />
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Page;
