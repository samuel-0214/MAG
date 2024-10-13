'use client';
// components/MaintenanceModal.js

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';

const MaintenanceModal = ({ isMaintenance }: { isMaintenance: boolean }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog.Root open={isMaintenance}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black bg-opacity-50' />
        <Dialog.Content className='fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-none bg-background p-8 shadow-lg outline-none'>
          <Dialog.Title className='mb-4 text-2xl font-bold text-lime-500'>Scheduled Upgrade Notice</Dialog.Title>
          <Dialog.Description className='text-base'>
            Due to a scheduled upgrade of the Router Intent backend, all intent applications will be paused from 7:00 PM
            UTC 14 July to 12:30 PM UTC 15 July. We apologize for any inconvenience this may cause and appreciate your
            understanding.
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MaintenanceModal;
