'use client';

import { useWalletContext } from '@/context/WalletContext';
import { emojiAvatarForAddress } from '@/lib/emojiAvatarForAddress';
import { capitalized, cn } from '@/lib/utils';
import { WalletData, WalletId } from '@/types/WalletContextTypes';
import { Copy } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { zeroAddress } from 'viem';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { WalletListItem } from './WalletList';
import { fetchAddressData } from '@/lib/fetchRnsData';
import { RNSData } from '@/types/intents';
import { useQuery } from '@tanstack/react-query';

export const AccountModal = ({
  open,
  setOpen,
  setWalletListOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setWalletListOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [copied, setCopied] = useState(false);
  // const { address } = useAccount();
  // const ensName = useEnsName({
  //   address,
  // });
  const { currentAccount, connectedWallets, connectWallet, currentWallet, disconnectWallet } = useWalletContext();

  const { color: backgroundColor, emoji } = useMemo(
    () => emojiAvatarForAddress(currentAccount?.address || zeroAddress),
    [currentAccount?.address],
  );

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);
  useEffect(() => {
    if (!currentAccount && open) {
      setOpen(false);
      setWalletListOpen(true);
    }
  }, [currentAccount, open, setOpen, setWalletListOpen]);

  const {
    data: rnsData,
    error: rnsDataError,
    isLoading: isRNSDataLoading,
  } = useQuery<RNSData, Error>({
    queryKey: ['addressData', currentAccount?.address],
    queryFn: () => fetchAddressData(currentAccount?.address || zeroAddress),
    retry: false,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className='min-h-64 w-[45ch] p-0'>
        <div className='flex h-full w-full flex-col gap-6'>
          <DialogHeader className='pt-4'>
            <DialogTitle className='text-center text-neutral-200'>Active Account</DialogTitle>

            <div className='grid w-full grid-cols-[5rem,_1fr] flex-col items-center justify-center gap-4 gap-y-1 px-4 pt-4'>
              <div className='relative row-span-2'>
                {/* {ensAvatar ? (
                  <Image
                    alt=''
                    src={ensAvatar}
                    width={256}
                    height={256}
                    className={'h-20 w-20 rounded-3xl border-2 border-gray-800 p-4 '}
                  />
                ) : ( */}
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-3xl border-2 text-4xl leading-none',
                    'select-none border-gray-800 bg-slate-700',
                  )}
                  style={{ backgroundColor }}
                >
                  <span className={`${rnsData?.resolvedData ? '' : 'drop-shadow-[0px_0px_4px_#ffffff]'}`}>
                    {rnsData?.resolvedData ? (
                      <span className=' text-xxl m-auto text-white'>
                        {capitalized(rnsData?.resolvedData.slice(0, 1))}
                      </span>
                    ) : (
                      emoji
                    )}
                  </span>
                </div>
                {/* )} */}
              </div>

              <span className='text-left'>
                {rnsData?.resolvedData
                  ? rnsData?.resolvedData
                  : `${currentAccount?.address?.slice(0, 6)}...${currentAccount?.address?.slice(-4)}`}
              </span>

              <div className='flex gap-2'>
                <Button
                  variant={'secondary'}
                  className='rounded-full'
                  onClick={() => {
                    navigator.clipboard.writeText(currentAccount?.address || '');
                    setCopied(true);
                  }}
                >
                  {copied ? 'Copied!' : rnsData?.resolvedData ? 'Copy address' : 'Copy'}{' '}
                  <Copy className='ml-[1ch] h-4 w-4' />
                </Button>

                <Button
                  onClick={() => {
                    if (currentWallet) disconnectWallet(currentWallet.id);
                    setOpen(false);
                  }}
                  variant={'outline'}
                  className='rounded-full text-red-500 hover:border-red-500 hover:bg-transparent hover:text-red-500'
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className='px-4 pb-4'>
            <h3>All Connected Wallets</h3>

            <div className='my-4 flex flex-col'>
              {Object.entries(connectedWallets).map(([networkType, wallets]) =>
                Object.entries(wallets)
                  .filter(([walletId, data]) => data?.address)
                  .map(([walletId, data]) => (
                    <WalletListItem
                      walletId={walletId as WalletId}
                      walletData={data as WalletData}
                      key={walletId}
                    />
                  )),
              )}
            </div>

            <Button
              className='w-full'
              variant={'secondary'}
              onClick={() => {
                setWalletListOpen(true);
              }}
            >
              Add Wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
