'use client';

import AmountInput from '@/components/AmountInput';
import CurrencyAndChainSelector from '@/components/CurrencyAndChainSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { CommandLoading } from 'cmdk';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { formatUnits, zeroAddress } from 'viem';
import { useReadContract } from 'wagmi';
import { Search } from 'lucide-react';

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

  const [baseName, setBaseName] = useState<string>('');
  const [debouncedBaseName] = useDebounceValue(baseName, 500);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

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

  const { data: isBaseNameAvailable, isLoading: isBaseNameAvailableLoading } = useReadContract({
    abi: [
      {
        inputs: [{ internalType: 'string', name: 'name', type: 'string' }],
        name: 'available',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    // BASE REGISTRAR CONTROLLER
    address: '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5',
    chainId: 8453,
    functionName: 'available',
    args: [debouncedBaseName],
    query: {
      enabled: !!debouncedBaseName,
    },
  });
  const { data: nameRegistrationPrice, isLoading: isRegisterPriceLoading } = useReadContract({
    abi: [
      {
        inputs: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'uint256', name: 'duration', type: 'uint256' },
        ],
        name: 'registerPrice',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    // BASE REGISTRAR CONTROLLER
    address: '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5',
    chainId: 8453,
    functionName: 'registerPrice',
    args: [debouncedBaseName, BigInt(duration * 365 * 24 * 60 * 60)],
    query: {
      enabled: !!debouncedBaseName,
    },
  });

  const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['basename suggestions', debouncedBaseName],
    queryFn: async () => {
      const res = (await fetch(`/api/basename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: debouncedBaseName,
        }),
      }).then((res) => res.json())) as {
        suggestion?: Array<string>;
      };

      return res?.suggestion;
    },
    enabled: !!debouncedBaseName,
  });

  const { data: ethPriceUsd, isLoading: isEthPriceLoading } = useQuery({
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
      nameRegistrationPrice,
      isBaseNameAvailable,
      debouncedBaseName,
      duration,
    ],
    queryFn: async ({ signal }) => {
      if (!sourceToken || !nameRegistrationPrice || !isBaseNameAvailable) {
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
              address: sourceToken.address,
              symbol: sourceToken.symbol,
              decimals: sourceToken.decimals,
            },
          ],
          SourceChainId: Number(sourceChainId),
          Protocol: [
            {
              protocolId: 'basename',
              chainId: '8453',
              action: 'register',
              poolId: 'basename-8453',
              data: {
                amountRequired: nameRegistrationPrice.toString(),
                duration: duration * 3_15_36_000,
                name: debouncedBaseName,
              },
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
    enabled: !!(sourceToken && sourceChainId && baseName && isBaseNameAvailable && !isBaseNameAvailableLoading),
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
      const data = await fetch(INTENTS_BASE_URI + '/router-intent/adapter/external/compose-adapter-calldata', {
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
    enabled: !!(protocolQuote && !isProtocolQuoteLoading && !balanceError && currentAccount),
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
    bridgeFee = bridgeToken === 'ETH' || bridgeToken === 'WETH' ? bridgeFeeReserve * ethPriceUsd : bridgeFeeReserve;

    return bridgeFee;
  }, [ethPriceUsd, feeQuote]);

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
            <CardTitle className='text-3xl text-blue-500'>Super Basenames</CardTitle>
          </CardHeader>

          <CardContent className='flex flex-col gap-4'>
            <div className='grid w-full items-center gap-1.5'>
              <div className='flex justify-between'>
                <Label
                  className={cn('font-normal')}
                  htmlFor='basename'
                >
                  Your Basename
                </Label>

                {baseNameError && <span className='text-sm leading-none text-red-500'>{baseNameError.message}</span>}
              </div>

              <Popover
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
              >
                <Command shouldFilter={false}>
                  <PopoverTrigger asChild>
                    <div
                      className='relative flex items-center border-b px-3'
                      cmdk-input-wrapper=''
                    >
                      <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                      <CommandPrimitive.Input
                        className={cn(
                          'z-[2] flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                          baseNameError ? 'ring-2  ring-red-500' : '',
                        )}
                        value={baseName}
                        onChangeCapture={handleBaseNameChange}
                        placeholder='Search rednobull.base.eth'
                      />

                      {baseName && (
                        <span className='absolute top-1/2 z-[1] ml-8 -translate-y-1/2 select-none text-sm opacity-50'>
                          <span className='text-transparent'>{baseName}</span>
                          <span>.base.eth</span>
                        </span>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className='w-[--radix-popover-trigger-width] p-0'
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <CommandList>
                      <CommandEmpty>Start by finding your name!</CommandEmpty>

                      {baseName ? (
                        <CommandItem
                          className='h-10'
                          key={`${baseName} .base.eth`}
                          disabled={!isBaseNameAvailable}
                          onSelect={() => {
                            setBaseName(baseName);
                            setDropdownOpen(false);
                          }}
                        >
                          <span className='mr-2'>
                            {baseName}
                            <span className='opacity-75'>.base.eth</span>
                          </span>
                          {isBaseNameAvailableLoading ||
                          isBaseNameAvailable === undefined ||
                          baseName !== debouncedBaseName ? (
                            <span className='text-xs text-neutral-500/80'>Checking...</span>
                          ) : isBaseNameAvailable ? (
                            <span className='text-xs text-blue-500/80'>Available</span>
                          ) : (
                            <span className='text-xs text-red-500/80'>Unavailable</span>
                          )}
                        </CommandItem>
                      ) : (
                        <CommandItem disabled={true}>Search for a name</CommandItem>
                      )}

                      {!isSuggestionsLoading && suggestions && suggestions?.length > 0 && (
                        <CommandGroup heading='Suggestions'>
                          <CommandSeparator />
                          {suggestions.map((suggestion, index) => (
                            <CommandItem
                              className='h-10'
                              key={`${suggestion} .base.eth ${index}`}
                              onSelect={() => {
                                setBaseName(suggestion);
                                setDropdownOpen(false);
                              }}
                            >
                              <span>{suggestion}</span>
                              <span className='opacity-75'>.base.eth</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </PopoverContent>
                </Command>
              </Popover>
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
                <Button
                  variant='outline'
                  onClick={() => duration > 1 && setDuration(duration - 1)}
                >
                  -
                </Button>

                <Input
                  className='w-full text-center'
                  type='text'
                  value={`${duration} year${duration > 1 ? 's' : ''}`}
                  onChange={() => {}}
                />

                <Button
                  variant='outline'
                  onClick={() => setDuration(duration + 1)}
                >
                  +
                </Button>
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
              label='You Pay'
            />
          </CardContent>

          <CardFooter className='mt-8 flex flex-col gap-4'>
            <div className='grid w-full grid-cols-3 gap-2 rounded-xl border border-neutral-800 bg-background/25 p-2'>
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
                <span className='text-xs'>Bridge Fee</span>
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
              <div className={'flex flex-col gap-1 rounded-md bg-background/40 p-2 text-neutral-400'}>
                <span className='text-xs'>Registration Fee</span>
                <span
                  className={cn(
                    'text-base font-medium text-neutral-300',
                    isRegisterPriceLoading ? 'animate-pulse rounded-xs bg-foreground/10 text-transparent' : '',
                  )}
                >
                  ${' '}
                  {isRegisterPriceLoading
                    ? 'Loading...'
                    : formatNumber(parseFloat(formatUnits(nameRegistrationPrice || 0n, 18)) * ethPriceUsd)}
                </span>
              </div>
            </div>

            <TxButtons
              className='w-full'
              chainId={sourceChainId}
              label={
                calldataQuote?.prioritySteps[step]
                  ? calldataQuote?.prioritySteps[step].instructionTitle || 'Transact'
                  : 'Buy Basename'
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
