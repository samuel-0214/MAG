import { useTransactionStatusContext } from '@/context/TransactionStatusContext';
import { cn, getExplorerLink } from '@/lib/utils';
import Link from 'next/link';
import { ChainIds, CHAINS } from '../../constants/chains';
import Image from 'next/image';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { isAdapterBridge } from '@/lib/intents/utils';
import AdapterStatus from './AdapterStatus';
import { CHAINS_DATA } from '@/constants/chains/list';

const AdapterNode = ({ adapterIndex }: { adapterIndex: string }) => {
  const { adapterStatuses: adapterStatuses, adapterMap } = useTransactionStatusContext();

  if (!adapterMap) return null;

  const adapterData = adapterMap[adapterIndex];
  const adapterStatus = adapterStatuses[adapterIndex];
  // const adapterStatus = adapterStatuses[adapterIndex];

  if (!adapterData) return null;

  return (
    <div
      key={adapterData.adapterId}
      className={cn(
        'relative flex h-fit w-full flex-col gap-4 p-2',
        adapterData.adapterIndices.length ? 'rounded-2xl border-2 border-border' : '',
      )}
    >
      {/* adapter card */}
      <div
        className={cn(
          'rounded-lg border-2 border-border bg-background p-3',
          adapterStatus?.status === 'src_failed' || adapterStatus?.status === 'dest_failed' ? 'border-red-500' : '',
        )}
      >
        <h2 className='mb-4 text-2xl text-lime-500'>{adapterData.adapterId}</h2>
        <span className='absolute right-4 top-4 opacity-5'>{adapterData.adapterIndex}</span>{' '}
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between'>
            <span className='text-neutral-400'>Status</span>
            <AdapterStatus
              adapterStatus={adapterStatus}
              adapterData={adapterData}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex items-end justify-between'>
              <span className='text-neutral-400'>{isAdapterBridge(adapterData.adapterType) ? 'Source' : 'Chain'}</span>

              <span className='flex items-center gap-1 capitalize'>
                <Image
                  src={`/images/chains/${CHAINS[adapterData.sourceChainId as ChainIds].toLowerCase()}.png`}
                  alt={''}
                  width={20}
                  height={20}
                  priority={true}
                  className='inline-block h-4 w-4 rounded-full bg-white'
                />

                {CHAINS_DATA[adapterData.sourceChainId as ChainIds].name}
              </span>
            </div>
            {isAdapterBridge(adapterData.adapterType) && (
              <div className='flex items-end justify-between'>
                <span className='text-neutral-400'>Destination</span>
                <span className='flex items-center gap-1 capitalize'>
                  <Image
                    src={`/images/chains/${CHAINS[adapterData.destChainId as ChainIds].toLowerCase()}.png`}
                    alt={''}
                    width={20}
                    height={20}
                    priority={true}
                    className='inline-block h-4 w-4 rounded-full bg-white'
                  />

                  {CHAINS_DATA[adapterData.destChainId as ChainIds].name}
                </span>
              </div>
            )}
          </div>

          <div className='flex gap-4'>
            {isAdapterBridge(adapterData.adapterType) ? (
              <>
                {adapterStatus?.data.srcTxHash && (
                  <Link
                    target='_blank'
                    className='flex items-center gap-1 whitespace-nowrap text-sm'
                    href={getExplorerLink(adapterStatus?.data.srcTxHash, adapterData.sourceChainId as ChainIds)}
                  >
                    Source Tx
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                )}
                {adapterStatus?.data.destTxHash && (
                  <Link
                    target='_blank'
                    className='flex items-center gap-1 whitespace-nowrap text-sm'
                    href={getExplorerLink(adapterStatus?.data.destTxHash, adapterData.destChainId as ChainIds)}
                  >
                    Destination Tx
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                )}
              </>
            ) : (
              <>
                {adapterStatus?.data.srcTxHash && (
                  <Link
                    target='_blank'
                    className='flex items-center gap-1 whitespace-nowrap text-sm'
                    href={getExplorerLink(adapterStatus?.data.srcTxHash, adapterData.sourceChainId as ChainIds)}
                  >
                    Transaction <ArrowUpRight className='h-4 w-4' />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* nested adapters */}
      {adapterData.adapterIndices.length ? (
        <div
          className={cn(
            'flex flex-col gap-2 rounded-lg',
            adapterStatus?.status === 'loading' ||
              adapterStatus?.status === 'src_failed' ||
              adapterStatus?.status === 'dest_failed'
              ? 'opacity-75 grayscale'
              : '',
          )}
        >
          {adapterData.adapterIndices?.map((adapterIndices, index) => {
            return (
              <AdapterNode
                adapterIndex={adapterIndices}
                key={index}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default AdapterNode;
