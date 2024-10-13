'use client'; // Error components must be Client Components

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main className='relative mx-auto mt-16 flex min-h-[calc(100vh_-_10rem)] max-w-[1600px] flex-col gap-8  p-4 px-8'>
        <h1 className='text-center text-4xl text-lime-500'>Whoops. Something went wrong!</h1>

        <code className='mx-auto mt-12 min-h-60 w-full max-w-[60ch] whitespace-break-spaces rounded-sm border border-gray-800 bg-gray-900 p-3'>
          <pre className='w-full text-wrap'>{error.message}</pre>
        </code>

        <Button
          className='mx-auto w-40 rounded-full'
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </main>

      <Footer />
    </>
  );
}
