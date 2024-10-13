'use client';
import { Label } from '@/components/ui/label';
import { ChainIds } from '@/constants/chains';
import { Token } from '@/constants/tokens';
import { Dispatch, SetStateAction } from 'react';
import NetworkSelector from './NetworkSelector';
import { TokenSelector } from './TokenSelector';
import { PlusCircle } from 'lucide-react';

const TokensSelector = ({
  setTokenA,
  tokenA,
  setTokenB,
  tokenB,
  testnet,
  sourceChainId,
  tokenList,
}: {
  tokenA: Token | undefined;
  setTokenA: Dispatch<SetStateAction<Token | undefined>>;
  tokenB: Token | undefined;
  setTokenB: Dispatch<SetStateAction<Token | undefined>>;
  testnet: boolean;
  sourceChainId: ChainIds;
  tokenList: Token[];
}) => {
  const handleSetTokenA = (token: Token) => {
    if (token.address === tokenB?.address) {
      setTokenB(undefined);
    }
    setTokenA(token);
  };

  const handleSetTokenB = (token: Token) => {
    if (token.address === tokenA?.address) {
      setTokenA(undefined);
    }
    setTokenB(token);
  };
  return (
    // <div className='grid w-full items-center gap-1.5'>
    //   <div className='grid xs:relative grid-cols-1 gap-x-4 gap-y-1.5 xs:grid-cols-3'>
    //     <Label
    //       className='order-1 font-normal'
    //       htmlFor=''
    //     >
    //       Token A
    //     </Label>
    //     <Label
    //       className='order-3 font-normal'
    //       htmlFor=''
    //     >
    //     </Label>
    //     <Label
    //       className='order-4 font-normal xs:order-3'
    //       htmlFor=''
    //     >
    //       Token B
    //     </Label>

    //     <div className='order-2 flex w-full xs:order-4'>
    //     <TokenSelector
    //         setSourceToken={setTokenA}
    //         sourceChainId={"8453"}
    //         sourceToken={tokenA}
    //       />
    //     </div>
    //     <div className='order-3 flex w-full xs:order-5'>
    //       <PlusCircle className=' m-auto' />
    //     </div>

    //     <div className='order-5 xs:absolute right-2 top-5 flex xs:order-6'>
    //       <TokenSelector
    //         setSourceToken={setTokenB}
    //         sourceChainId={"8453"}
    //         sourceToken={tokenB}
    //       />
    //     </div>
    //   </div>
    // </div>
    <div className=' flex w-full flex-col justify-between xs:flex-row'>
      <div className=' flex w-full flex-col justify-between gap-2 xs:w-[40%]'>
        <Label
          className=' font-normal'
          htmlFor=''
        >
          Token A
        </Label>
        <div className='flex w-full'>
          <TokenSelector
            setSourceToken={handleSetTokenA}
            sourceChainId={sourceChainId}
            sourceToken={tokenA}
            tokenList={tokenList}
          />
        </div>
      </div>
      <div className=' flex w-full flex-col justify-between gap-2 xs:w-[20%]'>
        <Label
          className=' font-normal'
          htmlFor=''
        ></Label>
        <div className='flex w-full justify-center'>
          <PlusCircle className=' xs:mb-2' />
        </div>
      </div>
      <div className=' flex w-full flex-col justify-between gap-2 xs:w-[40%]'>
        <Label
          className=' font-normal'
          htmlFor=''
        >
          Token B
        </Label>
        <div className='flex w-full'>
          <TokenSelector
            setSourceToken={handleSetTokenB}
            sourceChainId={sourceChainId}
            sourceToken={tokenB}
            tokenList={tokenList}
          />
        </div>
      </div>
    </div>
  );
};

export default TokensSelector;
