'use client';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TxSearch = () => {
  const [txHash, setTxHash] = useState<string>('');
  const router = useRouter();
  return (
    <div className='flex w-full max-w-sm items-center space-x-2'>
      <Input
        type='text'
        placeholder='Transaction hash'
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
      />
      <Button
        onClick={() => {
          router.push('/tx/' + txHash);
        }}
      >
        Search
      </Button>
    </div>
  );
};

export default TxSearch;
