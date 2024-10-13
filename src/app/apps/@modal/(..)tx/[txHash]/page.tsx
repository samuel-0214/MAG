'use client';
import IntentTransaction from '@/components/Transaction/IntentTransaction';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { useParams, useRouter } from 'next/navigation';

const Page = () => {
  const params = useParams<{
    chainId: string;
    txHash: string;
  }>();

  const router = useRouter();

  return (
    <Dialog
      open={true}
      onOpenChange={() => router.back()}
    >
      <DialogContent className='p-0'>
        <DialogHeader className='px-4 pt-4'>
          <h1 className='text-center text-2xl text-lime-500'>Track Your Transaction</h1>
        </DialogHeader>

        <div className='p-4 pt-4'>
          <IntentTransaction txHash={params.txHash} />

          <DialogFooter className='mt-4'>
            <Button
              variant='secondary'
              onClick={() => {
                router.back();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Page;
