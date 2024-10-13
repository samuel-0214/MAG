import { AdapterMapItem, BatchStatusMap, BatchStatusMapItem } from '@/types';
import React, { useMemo, useState } from 'react';
import BridgeClaimButton from './BridgeClaimButton';
import { cn } from '@/lib/utils';

const AdapterStatus = ({
  adapterStatus,
  adapterData,
}: {
  adapterStatus: BatchStatusMapItem;
  adapterData: AdapterMapItem;
}) => {
  const [claimStatus, setClaimStatus] = useState<'success' | undefined>(undefined);

  const statusText = useMemo(() => {
    if (adapterStatus?.status === 'received') {
      if (claimStatus === 'success') {
        return 'Claim Successful';
      }
      return 'Claim Pending';
    }

    return adapterStatus?.status ?? 'waiting';
  }, [adapterStatus?.status, claimStatus]);

  return (
    <>
      {adapterStatus?.status === 'received' ? (
        <BridgeClaimButton
          setClaimStatus={setClaimStatus}
          l1TxHash={adapterStatus?.data.srcTxHash}
          bridgeData={adapterData}
        />
      ) : null}
      <span
        className={cn(
          'rounded-sm bg-neutral-700 p-2 py-1 text-sm capitalize',
          adapterStatus?.status === 'loading' ? 'animate-pulse' : '',
          adapterStatus?.status === 'src_failed' || adapterStatus?.status === 'dest_failed' ? 'text-red-500' : '',
          adapterStatus?.status === 'successful' ? 'text-green-500' : '',
        )}
      >
        {statusText}
      </span>
    </>
  );
};

export default AdapterStatus;
