'use client';

import { useWalletContext } from '@/context/WalletContext';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { emojiAvatarForAddress } from '@/lib/emojiAvatarForAddress';
import { zeroAddress } from 'viem';
import { capitalized, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchAddressData } from '@/lib/fetchRnsData';

const WalletButton = () => {
  const { currentAccount, openWalletModal } = useWalletContext();

  const address = currentAccount?.address || zeroAddress;

  const { color: backgroundColor, emoji } = useMemo(() => emojiAvatarForAddress(address), [address]);

  const { data: rnsData } = useQuery({
    queryKey: ['addressData', address],
    queryFn: () => fetchAddressData(address),
    retry: false,
  });

  const displayName = rnsData?.resolvedData
    ? capitalized(rnsData.resolvedData.slice(0, 1))
    : `${currentAccount?.address?.slice(0, 6)}...${currentAccount?.address?.slice(-4)}`;

  return (
    <Button
      onClick={openWalletModal}
      className='gap-1 rounded-full'
    >
      {currentAccount ? (
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-3xl text-base leading-none',
            '-ml-3 select-none bg-slate-700',
          )}
          style={{ backgroundColor }}
        >
          <span className='drop-shadow-[0px_0px_4px_#ffffff]'>
            {rnsData?.resolvedData ? <span className='text-lg text-white'>{displayName}</span> : emoji}
          </span>
        </div>
      ) : (
        'Connect Wallet'
      )}
      {currentAccount &&
        (rnsData?.resolvedData
          ? rnsData.resolvedData
          : `${currentAccount?.address?.slice(0, 6)}...${currentAccount?.address?.slice(-4)}`)}
    </Button>
  );
};

export const DefaultWalletButton = () => {
  return <Button className='rounded-full'>Connect Wallet</Button>;
};

export default WalletButton;
