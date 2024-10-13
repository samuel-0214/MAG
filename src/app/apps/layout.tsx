import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function Layout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <>
      <Header mode={'app'} />

      <main className='relative mx-auto mb-24 flex min-h-[calc(100vh_-_10rem)] max-w-[1600px] flex-col gap-8 p-2 sm:px-8 ht-md:mt-8'>
        {modal}
        {children}
      </main>

      {/* <Footer /> */}
    </>
  );
}
