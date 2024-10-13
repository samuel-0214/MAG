import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <Header />

      <main className='relative mx-auto mt-16 flex min-h-[calc(100vh_-_10rem)] max-w-[1600px] flex-col gap-8  p-4 px-8'>
        Intents. Whooooo
      </main>

      <Footer />
    </>
  );
}
