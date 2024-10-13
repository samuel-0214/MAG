import Footer from '@/components/Footer';
import Header from '@/components/Header';
import TxSearch from '@/components/Transaction/TxSearch';

const Page = () => {
  return (
    <>
      <Header />

      <main className='relative mx-auto mt-16 flex min-h-[calc(100vh_-_10rem)] max-w-[1600px] flex-col gap-8  p-4 px-8'>
        <h1 className='text-center text-4xl text-lime-500'>Find Transaction</h1>
        <div className='flex justify-center'>
          <TxSearch />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Page;
