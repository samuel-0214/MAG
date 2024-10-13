import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import AppContext from '@/context/AppContext';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
import MaintenanceModal from '@/components/MaintenancePopover';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Router Intents | PoC',
  description: 'A proof of concept for Router Crosschain Intents Framework',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`dark ${spaceGrotesk.className}`}>
        <div className='bg-lines'>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <AppContext>{children}</AppContext>
        <MaintenanceModal isMaintenance={false} />
        <Toaster />
      </body>
    </html>
  );
}
