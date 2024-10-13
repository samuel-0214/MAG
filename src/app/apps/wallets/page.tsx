'use client';
import NetworkSelector from '@/components/NetworkSelector';
import { ChainIds } from '@/constants/chains';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const TxButtons = dynamic(() => import('@/components/TxButton'), { ssr: false });
const WalletList = dynamic(() => import('@/components/Wallet/WalletList'), { ssr: false });

const Page = () => {
  const [currentChainId, setChain] = useState<ChainIds>('1');
  return (
    <>
      <h1 className='text-center text-4xl text-lime-500'>Wallets</h1>
      <div className='mx-auto flex w-full max-w-[45ch] flex-col gap-2'>
        <div className='my-4 flex flex-col gap-2'>
          <WalletList showNetwork={true} />

          <div className='grid grid-cols-2 gap-2'>
            <NetworkSelector
              currentChainId={currentChainId}
              setChain={setChain}
              chains={['1', '10', '59144', '42161', '137']}
            />
            <TxButtons
              chainId={currentChainId}
              error={null}
              handleComplete={() => {}}
              handleTransaction={() => {}}
              isDisabled={false}
              isLoading={false}
              isSubmitting={false}
              label='Test Tx Button'
              success={false}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
