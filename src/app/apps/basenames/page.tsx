'use client';
import Lottie from 'react-lottie';
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
import confetti from '@/assets/confetti.json';
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
import { NATIVE, cn, shortenAddress, updateDbTransaction } from '@/lib/utils';
import { ComposeCalldataResponse, FeeQuoteCalldataResponse, ProtocolParamsResponse } from '@/types/intents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CommandLoading } from 'cmdk';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { encodeFunctionData, formatUnits, parseUnits, zeroAddress } from 'viem';
import { useReadContract, useSendTransaction } from 'wagmi';
import { Search } from 'lucide-react';
import useTokenAllowance from '@/hooks/useTokenAllowance';
import IntentTransaction from '@/components/Transaction/IntentTransaction';
import useConfetti from '@/hooks/useConfetti';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/context/WagmiContext';

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

const BASE_REGISTRAR_CONTROLLER = '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5';
const REVERSE_REGISTRAR = '0x79ea96012eea67a83431f1701b3dff7e37f9e282';

const confettiOption = {
  loop: false,
  autoplay: true,
  animationData: confetti,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

const Page = () => {
  const router = useRouter();

  const [sourceChainId, setSourceChainId] = useState<ChainIds>('137');
  const [sourceToken, setSourceToken] = useState<Token | undefined>();

  const [baseName, setBaseName] = useState<string>('');
  const [debouncedBaseName] = useDebounceValue(baseName, 500);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // duration in years
  const [duration, setDuration] = useState<number>(1);

  const [buyTxHash, setBuyTxHash] = useState<string>('');
  const [openTxScreen, setOpenTxScreen] = useState<boolean>(false);
  const [enablePrimarySection, setEnablePrimarySection] = useState<boolean>(false);
  const { showConfetti, setShowConfetti } = useConfetti();
  const [showDialog, setShowDialog] = useState<boolean>(false);
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
    setDropdownOpen(true);
    setBaseName(e.target.value.trim());
  }, []);

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

  const baseNameError = useMemo(() => {
    if (baseName && !isBaseNameAvailable && !isBaseNameAvailableLoading) return new Error('Basename is not available');
    // if base names include any special characters or non-alphanumeric characters
    const specialChars = /[^a-zA-Z0-9]/;

    if (specialChars.test(baseName)) return new Error('Basename cannot include special characters');

    return baseName.includes(' ') ? new Error('Basename cannot include spaces') : undefined;
  }, [baseName, isBaseNameAvailable, isBaseNameAvailableLoading]);

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
          Amount: ['1'],
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
        throw new Error(data.Errors[0].Message?.title || 'Error');
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
      Number(protocolQuote.quote[0].amountSent) > Number(tokenBalance?.value)
      ? new Error('Insufficient Funds')
      : undefined;
  }, [isProtocolQuoteLoading, protocolQuote, tokenBalance]);

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
      const data = await fetch(INTENTS_BASE_URI + '/router-intent/external/compose-adapter-calldata', {
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
      setBuyTxHash(txHash);
      setOpenTxScreen(true);
      updateDbTransaction({
        id: calldataQuote?.trnxId!,
        hash: txHash,
        status: 'COMPLETED',
        gasFee: '0',
      });
    },
    [calldataQuote?.trnxId],
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

  const { sendTransactionAsync } = useSendTransaction();
  const {
    mutateAsync: handlePrimaryNameTransaction,
    data: primaryNameTx,
    isPending: isSettingPrimaryName,
    error: primaryNameTxError,
  } = useMutation({
    mutationKey: ['primary name transaction', baseName],
    mutationFn: async () => {
      const txHash = await sendTransactionAsync({
        chainId: 8453,
        to: REVERSE_REGISTRAR,
        value: 0n,
        data: encodeFunctionData({
          abi: [
            {
              inputs: [{ internalType: 'string', name: 'name', type: 'string' }],
              name: 'setName',
              outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ] as const,
          args: [baseName],
          functionName: 'setName',
        }),
      });

      setShowDialog(true);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        chainId: 8453,
      });

      return txHash;
    },
    onMutate: () => {
      setShowConfetti(true);
    },
  });

  return (
    <>
      <div className='mx-auto flex w-full flex-wrap justify-center gap-2'>
        <Card className='max-w-[50ch] flex-1 rounded-2xl'>
          <CardHeader>
            <CardTitle className='text-3xl text-blue-500'>1. Get Basename</CardTitle>
          </CardHeader>

          {openTxScreen && buyTxHash ? (
            <div className='overflow-auto'>
              <IntentTransaction
                txHash={buyTxHash}
                onTxComplete={() => setEnablePrimarySection(true)}
              />
            </div>
          ) : (
            <>
              <CardContent className='flex flex-col gap-4'>
                <div className='grid w-full items-center gap-1.5'>
                  <div className='flex justify-between'>
                    <Label
                      className={cn('font-normal')}
                      htmlFor='basename'
                    >
                      Your Basename
                    </Label>

                    {baseNameError && (
                      <span className='text-sm leading-none text-red-500'>{baseNameError.message}</span>
                    )}
                  </div>

                  <Popover
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <Command shouldFilter={false}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn('relative flex items-center border-b px-3')}
                          cmdk-input-wrapper=''
                        >
                          <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                          <CommandPrimitive.Input
                            className={cn(
                              'ring-none z-[2] flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
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
                  stakeAmount={formatUnits(
                    BigInt(protocolQuote?.quote[0].amountSent || 0n),
                    sourceToken?.decimals || 18,
                  )}
                  tokenBalance={tokenBalance}
                  label='You Pay'
                  isLoading={isProtocolQuoteLoading}
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
                  label={'Buy Basename'}
                  error={undefined}
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
                  successLabel={`Bought ${baseName}.base.eth!`}
                />

                {buyTxHash && (
                  <Button
                    className='w-full'
                    onClick={() => window.open('/tx/' + buyTxHash, '_blank')}
                  >
                    View Transaction
                  </Button>
                )}
              </CardFooter>
            </>
          )}
        </Card>

        {/* Set as primary name */}
        <Card
          className={cn(
            'h-min max-w-[50ch] flex-1 rounded-2xl',
            buyTxHash && enablePrimarySection ? 'opacity-100' : 'pointer-events-none opacity-50',
          )}
        >
          <CardHeader>
            <CardTitle className='text-3xl text-blue-500'>2. Set as Primary Name</CardTitle>
            <CardDescription className='text-neutral-300'>
              Set your new Basename as your primary name on ENS. This will resolve your account address to{' '}
              {baseName || 'name'}.base.eth
            </CardDescription>
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
              </div>

              <Input
                className='w-full'
                type='text'
                value={baseName || 'name' + '.base.eth'}
                onChange={() => {}}
              />
            </div>
          </CardContent>

          <CardFooter className='mt-8 flex flex-col gap-4'>
            <TxButtons
              className='w-full'
              chainId={'8453'}
              label={'Set as Primary Name'}
              error={null}
              handleComplete={() => {}}
              handleTransaction={handlePrimaryNameTransaction}
              isDisabled={!buyTxHash}
              isLoading={false}
              isSubmitting={isSettingPrimaryName}
              success={!!primaryNameTx}
              errorLabel={'Something went wrong'}
              loadingLabel={'Loading'}
              successLabel='Successfully set as primary name!'
            />
          </CardFooter>
        </Card>
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => setShowDialog(open)}
        modal={true}
      >
        <DialogContent className='p-0'>
          <DialogHeader className='px-4 pt-4'>
            <DialogTitle>Bought {baseName}.base.eth!</DialogTitle>
          </DialogHeader>
          <div className='p-4 pt-4'>
            <DialogDescription>
              {`${baseName}.base.eth`} has been successfully purchased and set as your primary name on ENS.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
      {showConfetti && (
        <>
          <div className='absolute left-1/2 top-0 z-50 h-full w-full -translate-x-1/2 cursor-default touch-none '>
            <Lottie
              isClickToPauseDisabled={true}
              options={confettiOption}
              height={500}
              width={500}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Page;
