import Link from 'next/link';
import React from 'react';
import RouterI from '@/assets/RouterI.svg';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className='z-[1] flex flex-col items-center justify-center rounded-t-3xl border-t-2  border-neutral-900 bg-neutral-950 px-0'>
      <div className='flex min-h-[22rem] w-full max-w-[1600px] flex-col justify-between gap-8 p-8 lg:flex-row lg:p-16'>
        <div className=''>
          <Image
            src={RouterI}
            width={256}
            height={256}
            alt='Router Intents'
            className='w-48'
          />
        </div>

        <div className='grid w-full max-w-[60ch] grid-cols-1 gap-4 sm:grid-cols-3'>
          <div className='grid h-min w-full max-w-[25ch] grid-cols-1 gap-4'>
            <h4 className='text-2xl font-medium text-lime-500 sm:mb-4'>Products</h4>

            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://app.routernitro.com'
              target='_blank'
            >
              Router Nitro
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://explorer.routernitro.com/'
              target='_blank'
            >
              Nitro Explorer
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://routerscan.io/'
              target='_blank'
            >
              Routerscan
            </Link>
          </div>

          <div className='grid h-min w-full max-w-[25ch] grid-cols-1 gap-4'>
            <h4 className='text-2xl font-medium text-lime-500 sm:mb-4'>Developers</h4>

            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://docs.routerprotocol.com/'
              target='_blank'
            >
              Documentation
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://routerprotocol.medium.com/'
              target='_blank'
            >
              Medium Blog
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://www.routerprotocol.com/router-ccif-whitepaper.pdf'
              target='_blank'
            >
              CCIF Whitepaper
            </Link>
          </div>
          <div className='grid h-min w-full max-w-[25ch] grid-cols-1 gap-4'>
            <h4 className='text-2xl font-medium text-lime-500 sm:mb-4'>Support</h4>

            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://t.me/routerprotocol'
              target='_blank'
            >
              Telegram
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://discord.gg/mqTVEsRKSu'
              target='_blank'
            >
              Discord
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='https://twitter.com/RouterProtocol'
              target='_blank'
            >
              Twitter / X
            </Link>
            <Link
              className='text-white-800 font-light hover:text-neutral-300'
              href='mailto:contact@routerprotocol.com'
              target='_blank'
            >
              Email
            </Link>
          </div>
        </div>
      </div>

      {/* <Link
        href={'/tos'}
        target='_blank'
        className='font-thin'
      >
        Terms of Service
      </Link> */}
    </footer>
  );
};

export default Footer;
