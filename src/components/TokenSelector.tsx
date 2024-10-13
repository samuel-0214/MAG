'use client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CHAINS, ChainIds } from '@/constants/chains';
import { TOKEN_SYMBOL_MAP, Token } from '@/constants/tokens';
import { useWalletContext } from '@/context/WalletContext';
import useTokenData from '@/hooks/useTokenData';
import { formatNumber } from '@/lib/formatNumber';
import { NATIVE, cn, getTokenLogoURI, isTokenETH } from '@/lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export const TokenSelector = ({
  sourceChainId,
  sourceToken,
  setSourceToken,
  tokenList,
}: {
  sourceChainId: ChainIds;
  sourceToken: Token | undefined;
  setSourceToken: (token: Token) => void;
  tokenList: Token[];
}) => {
  const [open, setOpen] = useState(false);

  const handlePaste = useCallback(
    (e: any) => {
      navigator.clipboard.readText().then(async (address) => {
        // check if text is an address
        if (address.length !== 42) return;
        if (!address.startsWith('0x')) return;
        if (isTokenETH(address)) {
          setSourceToken(TOKEN_SYMBOL_MAP[sourceChainId][NATIVE]);
          setOpen(false);
          return;
        }

        address = address.toLowerCase();
        let token = tokenList.find((t) => t.address === address || t.symbol === address);

        // if (!token) {
        //   const tokenData = await getToken({
        //     address: address as `0x${string}`,
        //     chainId: CHAIN_IDS[sourceChain],
        //   });

        //   token = {
        //     address: tokenData.address,
        //     symbol: tokenData.symbol,
        //     chainId: CHAIN_IDS[sourceChain],
        //     decimals: tokenData.decimals,
        //   };

        //   setLocalTokenList({
        //     ...localTokenList,
        //     [address]: token,
        //   });
        // }

        if (token) {
          setSourceToken(token);
          // setOpen(false);
        }
      });
    },
    [tokenList, setSourceToken, sourceChainId],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='flex-1 justify-start gap-2 px-3 text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        >
          {sourceToken?.address ? (
            <img
              loading='eager'
              src={getTokenLogoURI(sourceToken.address, CHAINS[sourceChainId])}
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
            <div className='h-5 w-5 rounded-full border-[1px]'></div>
          )}

          {sourceToken ? sourceToken.symbol || sourceToken.address : 'Select Token'}
          <ChevronDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[calc(100vw_-_4rem)] p-0 xs:w-max '>
        <Command className='max-h-[80svh]'>
          <TokenSearchInput
            placeholder='ETH, 0x...'
            handlePaste={handlePaste}
          />

          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>

            <CommandGroup>
              {/* {Object.values(localTokenList).map((token, index) => (
                <TokenListItem
                  key={token.address + ' - ' + token.symbol + index}
                  itemKey={token.address + ' - ' + token.symbol}
                  token={token}
                  sourceToken={sourceToken}
                  setSourceToken={setSourceToken}
                  setOpen={setOpen}
                  sourceChain={sourceChainId}
                />
              ))}

              {Object.keys(localTokenList).length > 0 && <CommandSeparator />} */}

              {tokenList
                // .filter((t) => !localTokenList[t.address])
                .map((token, index) => (
                  <TokenListItem
                    key={token.address + ' - ' + token.symbol + ' - ' + index}
                    itemKey={token.address + ' - ' + token.symbol}
                    token={token}
                    sourceToken={sourceToken}
                    setSourceToken={setSourceToken}
                    setOpen={setOpen}
                    sourceChain={sourceChainId}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const TokenListItem = ({
  token,
  sourceToken,
  setSourceToken,
  setOpen,
  sourceChain,
  itemKey,
}: {
  token: Token;
  sourceToken: Token | undefined;
  setSourceToken: (token: Token) => void;
  setOpen: (open: boolean) => void;
  sourceChain: ChainIds;
  itemKey: string;
}) => {
  const { currentAccount } = useWalletContext();
  const { tokenBalance } = useTokenData({
    account: currentAccount?.address || '',
    chainId: sourceChain,
    tokenAddress: token.address,
  });
  return (
    <CommandItem
      value={itemKey}
      onSelect={() => {
        setSourceToken(token);
        setOpen(false);
      }}
      className='flex cursor-pointer gap-2'
    >
      <img
        loading='eager'
        src={getTokenLogoURI(token.address, CHAINS[sourceChain])}
        alt={''}
        width={20}
        height={20}
        className='inline-block h-5 w-5 rounded-full'
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src = '/images/icons/unknown.png';
        }}
      />

      {token.symbol}

      {tokenBalance && (
        <span className='ml-auto text-xs text-muted-foreground'>{formatNumber(tokenBalance.formatted)}</span>
      )}

      <Check className={cn(' h-4 w-4', sourceToken?.address === token.address ? 'opacity-100' : 'opacity-0')} />
    </CommandItem>
  );
};

const TokenSearchInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  { handlePaste: (e: any) => void } & React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, handlePaste, ...props }, ref) => (
  <div
    className='flex items-center border-b px-3'
    cmdk-input-wrapper=''
  >
    <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
    <CommandPrimitive.Input
      onPaste={handlePaste}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />

    <Button
      onClick={handlePaste}
      variant='outline'
      className='absolute right-2 top-3 h-6 w-12 p-1 text-xs'
    >
      Paste
    </Button>
  </div>
));
TokenSearchInput.displayName = 'TokenSearchInput';
