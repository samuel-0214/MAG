'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className='relative mx-auto mt-16 flex min-h-[calc(100vh_-_10rem)] max-w-[1600px] flex-col gap-8  p-4 px-8'>
        <h1 className='text-center text-4xl text-lime-500'>Curious much?</h1>

        <code className='mx-auto mt-12 min-h-60 w-full max-w-[60ch] whitespace-break-spaces rounded-sm border border-gray-800 bg-gray-900 p-3'>
          <pre className='w-full text-wrap'>
            404 - Page not found
            <br />
            <br />
            &gt; We love your venturesome spirit, but this is a page we haven&lsquo;t discovered yet.
            <br />
            <br />
            &gt; Shoot us an email if you&lsquo;ve an idea we should explore.
          </pre>
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
