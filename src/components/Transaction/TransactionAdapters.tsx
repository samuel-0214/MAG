import { useTransactionStatusContext } from '@/context/TransactionStatusContext';
import AdapterNode from './AdapterNode';
import Link from 'next/link';
import { getExplorerLink, shortenAddress } from '@/lib/utils';
import { ArrowUpRight, Copy } from 'lucide-react';
import { ChainIds, CHAINS } from '@/constants/chains';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { isAdapterBridge } from '@/lib/intents/utils';
import { CHAINS_DATA } from '@/constants/chains/list';

const TransactionAdapters = () => {
  const { adapters, sourceTxData } = useTransactionStatusContext();

  if (!adapters && !sourceTxData)
    return (
      <div className='mx-auto grid w-full max-w-[60ch] grid-cols-1 justify-center gap-2'>
        <h2 className='text-center text-lg'>Fetching your transaction data</h2>
        <Skeleton className='h-20 w-full'></Skeleton>
        <div className='flex w-full justify-center gap-2'>
          <div className='flex w-full flex-col gap-2'>
            <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>
            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
          </div>
          <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>

          <div className='flex w-full flex-col gap-2'>
            <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>

            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
          </div>
        </div>
      </div>
    );

  return (
    <div className='mx-auto grid w-full max-w-[60ch] grid-cols-1 justify-center gap-2'>
      <div className='flex w-full flex-col gap-2 rounded-xl border-2 border-border p-4'>
        <div className='flex justify-between'>
          <span className='text-neutral-400'>Source Transaction</span>

          {sourceTxData?.hash ? (
            <>
              <Link
                target='_blank'
                className='flex items-center gap-1'
                href={getExplorerLink(sourceTxData?.hash, sourceTxData?.chainId as ChainIds)}
              >
                {shortenAddress(sourceTxData?.hash || '')} <ArrowUpRight className='h-4 w-4' />
              </Link>
            </>
          ) : (
            <span>Loading...</span>
          )}
        </div>

        <div className='flex justify-between'>
          <span className='text-neutral-400'>Chain</span>

          {sourceTxData?.chainId ? (
            <span className='flex items-center gap-1 capitalize'>
              <Image
                src={`/images/chains/${CHAINS[sourceTxData.chainId as ChainIds].toLowerCase()}.png`}
                alt={''}
                width={20}
                height={20}
                priority={true}
                className='inline-block h-4 w-4 rounded-full bg-white'
              />

              {CHAINS_DATA[sourceTxData.chainId as ChainIds].name}
            </span>
          ) : (
            <span>Loading...</span>
          )}
        </div>

        <div className='flex justify-between'>
          <span className='text-neutral-400'>Sender</span>

          {sourceTxData?.chainId ? (
            <span
              className='flex cursor-pointer items-center gap-1 capitalize'
              onClick={() => {
                navigator.clipboard.writeText(sourceTxData.from);
                toast.success('Copied to clipboard', { position: 'top-right' });
              }}
            >
              {shortenAddress(sourceTxData.from)} <Copy className='h-3 w-3' />
            </span>
          ) : (
            <span>Loading...</span>
          )}
        </div>
      </div>

      {adapters ? (
        <div className='flex w-full  flex-wrap justify-center gap-2'>
          {adapters
            .filter((adapter) => adapter.adapterIndex.split('-').length === 2)
            .map((adapter) => (
              <AdapterNode
                adapterIndex={adapter.adapterIndex}
                key={adapter.adapterIndex}
              />
            ))}
        </div>
      ) : (
        <div className='flex w-full justify-center gap-2'>
          <div className='flex w-full flex-col gap-2'>
            <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>
            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
          </div>
          <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>

          <div className='flex w-full flex-col gap-2'>
            <Skeleton className='h-16 w-full max-w-[60ch]'></Skeleton>

            <Skeleton className='h-32 w-full max-w-[60ch]'></Skeleton>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionAdapters;
