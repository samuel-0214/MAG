'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Drawer, DrawerHeader, DrawerPortal, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import { Dispatch, ElementRef, SetStateAction, useEffect, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Button } from './ui/button';
import { formatNumber } from '@/lib/formatNumber';
import { cn, getTokenLogoURI } from '@/lib/utils';
import { CHAINS, ChainIds } from '@/constants/chains';
import { TOKEN_SYMBOL_MAP, Token } from '@/constants/tokens';
import useGammaPools from '@/hooks/useGammaPools';
import LoadingSpinner from './ui/LoadingSpinner';
import { GammaPool } from '@/types/lynex';
import { AutomatedPoolType } from '@/types/enum';
import { NuriPool } from '@/types/nuri';
import { useQuery } from '@tanstack/react-query';

type Pool = {
  token0: string;
  token1: string;
  initialFee: number;
};
interface PoolSelectorProps {
  containerRef: React.RefObject<ElementRef<'div'>>;
  sourceChainId: ChainIds;
  tokenA?: Token;
  setTokenA: (token: Token) => void;
  tokenB?: Token;
  setTokenB: (token: Token) => void;
  setAutomatedPoolType?: Dispatch<SetStateAction<AutomatedPoolType>>;
  poolSeleterType: string;
  setFeeTier?: Dispatch<SetStateAction<string>>;
}

interface DrawerComponentProps {
  containerRef: React.RefObject<ElementRef<'div'>>;
  automatedPool: GammaPool[] | NuriPool[] | undefined;
  sourceChainId: ChainIds;
  tokenA?: Token;
  setTokenA: (token: Token) => void;
  tokenB?: Token;
  setTokenB: (token: Token) => void;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isAutomatedPoolLoading: boolean;
  poolSelecter?: GammaPool | NuriPool;
  setPoolSelecter: Dispatch<SetStateAction<GammaPool | NuriPool | undefined>>;
}

interface PoolSelecterProps extends Omit<DrawerComponentProps, 'automatedPool' | 'isAutomatedPoolLoading'> {
  setAutomatedPoolType?: Dispatch<SetStateAction<AutomatedPoolType>>;
}

const getAutomatedPoolType = (title: string): AutomatedPoolType | undefined => {
  switch (title) {
    case 'Gamma Narrow':
      return AutomatedPoolType['Gamma Narrow'];
    case 'Gamma Correlated':
      return AutomatedPoolType['Gamma Correlated'];
    default:
      return undefined;
  }
};

const PoolSelector = ({
  containerRef,
  sourceChainId,
  tokenA,
  tokenB,
  setTokenA,
  setTokenB,
  setAutomatedPoolType,
  poolSeleterType,
  setFeeTier,
}: PoolSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [poolSelecter, setPoolSelecter] = useState<GammaPool | NuriPool | undefined>(undefined);

  const PoolSelecterComponent = poolSeleterType === 'lynex' ? LynexPoolSelecter : NuriPoolSelecter;

  useEffect(() => {
    if (poolSelecter && isNuriPool(poolSelecter) && setFeeTier) {
      setFeeTier(poolSelecter.initialFee.toString());
    }
  }, [poolSelecter]);

  return (
    <div className='grid grid-cols-2 gap-x-2 gap-y-2 bg-card'>
      <Label className='text-black-muted col-span-2 text-sm font-normal'>Select Pair</Label>
      <PoolSelecterComponent
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        setTokenA={setTokenA}
        setTokenB={setTokenB}
        sourceChainId={sourceChainId}
        containerRef={containerRef}
        tokenA={tokenA}
        tokenB={tokenB}
        poolSelecter={poolSelecter}
        setPoolSelecter={setPoolSelecter}
        setAutomatedPoolType={setAutomatedPoolType}
      />
    </div>
  );
};

const LynexPoolSelecter = ({
  isOpen,
  setIsOpen,
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  containerRef,
  sourceChainId,
  poolSelecter,
  setPoolSelecter,
  setAutomatedPoolType,
}: PoolSelecterProps) => {
  const { data: automatedPool, isLoading: isAutomatedPoolLoading } = useGammaPools(sourceChainId);

  useEffect(() => {
    if (poolSelecter) {
      const poolType = getAutomatedPoolType(poolSelecter.title);
      if (poolType !== undefined && setAutomatedPoolType) {
        setAutomatedPoolType(poolType);
      }
    }
  }, [poolSelecter, setAutomatedPoolType]);

  return (
    <DrawerComponent
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      setTokenA={setTokenA}
      setTokenB={setTokenB}
      sourceChainId={sourceChainId}
      automatedPool={automatedPool}
      containerRef={containerRef}
      tokenA={tokenA}
      tokenB={tokenB}
      isAutomatedPoolLoading={isAutomatedPoolLoading}
      poolSelecter={poolSelecter}
      setPoolSelecter={setPoolSelecter}
    />
  );
};

const NuriPoolSelecter = ({
  isOpen,
  setIsOpen,
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  containerRef,
  sourceChainId,
  poolSelecter,
  setPoolSelecter,
}: PoolSelecterProps) => {
  const [nuriList, setNuriList] = useState<NuriPool[] | undefined>(undefined);
  const pools = getPoolsData();

  const { data: nuriPairList } = useQuery({
    queryKey: ['Nuri pair list'],
    queryFn: fetchNuriPairs,
  });

  useEffect(() => {
    if (nuriPairList) {
      setNuriList(filterPools(pools, nuriPairList));
    }
  }, [nuriPairList]);

  return (
    <DrawerComponent
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      setTokenA={setTokenA}
      setTokenB={setTokenB}
      sourceChainId={sourceChainId}
      automatedPool={nuriList}
      containerRef={containerRef}
      tokenA={tokenA}
      tokenB={tokenB}
      isAutomatedPoolLoading={false}
      poolSelecter={poolSelecter}
      setPoolSelecter={setPoolSelecter}
    />
  );
};

const DrawerComponent = ({
  isOpen,
  automatedPool,
  setIsOpen,
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  containerRef,
  sourceChainId,
  isAutomatedPoolLoading,
  poolSelecter,
  setPoolSelecter,
}: DrawerComponentProps) => (
  <Drawer
    shouldScaleBackground={false}
    open={isOpen}
    onOpenChange={setIsOpen}
    modal={false}
    preventScrollRestoration={false}
  >
    <div className='col-span-3 grid w-full grid-cols-[1fr_auto_1fr] gap-4'>
      <TokenButton
        token={tokenA}
        automatedPool={automatedPool}
        onClick={() => setIsOpen(true)}
        sourceChainId={sourceChainId}
        label='Token A'
      />
      <span className='m-auto flex w-full'>
        <PlusCircle />
      </span>
      <TokenButton
        token={tokenB}
        automatedPool={automatedPool}
        onClick={() => setIsOpen(true)}
        sourceChainId={sourceChainId}
        label='Token B'
      />
    </div>
    <DrawerPortal container={containerRef?.current}>
      <DrawerPrimitive.Content
        className={cn(
          'absolute inset-x-0 top-0 z-40 mx-auto flex h-full w-full max-w-[55ch] flex-col rounded-t-2xl border bg-background p-0 after:hidden',
        )}
      >
        <div className='mx-auto mt-2 h-1 w-[100px] rounded-full bg-muted' />
        <DrawerHeader className='px-6 pt-6 md:px-8 md:pt-8'>
          <DrawerTitle className='text-left font-normal'>Select Automated Strategy</DrawerTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant='outline'
            className='absolute right-6 top-8 h-8 w-8 p-2'
          >
            <X className='h-6 w-6' />
          </Button>
        </DrawerHeader>
        {isAutomatedPoolLoading ? (
          <div className='grid h-full w-full flex-1 items-center justify-center'>
            <LoadingSpinner />
          </div>
        ) : (
          <Accordion
            type='single'
            className='flex flex-col gap-4 overflow-auto px-6 py-4 md:px-8'
          >
            {automatedPool?.map((pool: GammaPool | NuriPool) => (
              <PoolItem
                key={pool.address}
                pool={pool}
                setTokenA={setTokenA}
                setTokenB={setTokenB}
                sourceChainId={sourceChainId}
                poolSelecter={poolSelecter}
                setPoolSelecter={setPoolSelecter}
              />
            ))}
          </Accordion>
        )}
        <Button
          className='mx-8 mb-8 mt-auto disabled:text-primary-foreground'
          onClick={() => {
            setIsOpen(false);
            selectTokens(poolSelecter, setTokenA, setTokenB, sourceChainId);
          }}
          disabled={!automatedPool || !poolSelecter}
        >
          {automatedPool && poolSelecter
            ? `Continue with ${isNuriPool(poolSelecter) ? poolSelecter.symbol.split('-').slice(1, 3).join('-') : poolSelecter.symbol.split(' ')[0]}`
            : 'Select automated pair'}
        </Button>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  </Drawer>
);

const PoolItem = ({
  pool,
  setTokenA,
  setTokenB,
  sourceChainId,
  poolSelecter,
  setPoolSelecter,
}: {
  pool: GammaPool | NuriPool;
  setTokenA: (token: Token) => void;
  setTokenB: (token: Token) => void;
  sourceChainId: ChainIds;
  poolSelecter: GammaPool | NuriPool | undefined;
  setPoolSelecter: (pool: GammaPool | NuriPool | undefined) => void;
}) => {
  const isSelected = poolSelecter?.address === pool.address;

  return (
    <AccordionItem
      key={pool.address}
      value={pool.symbol}
      className={cn(
        `relative z-0 rounded-xl border outline-2 outline-[#e5e5e5] transition-all hover:border-white hover:bg-card hover:outline-white/25 ${isSelected ? 'border-white bg-card' : 'border-neutral-800'}`,
        'after:absolute after:left-[1.875rem] after:top-10 after:-z-[1] after:w-2 after:border-l-2 ',
      )}
    >
      <AccordionTrigger
        onClick={() => setPoolSelecter(pool)}
        className='grid grid-cols-[2rem_1fr_auto] justify-start gap-y-1 rounded-xl px-4 text-left hover:no-underline disabled:opacity-25 sm:grid-cols-[2rem_1fr_6ch_8ch]'
        disableChevron
      >
        <div className='flex w-full justify-between'>
          <TokenIcons
            pool={pool}
            sourceChainId={sourceChainId}
          />
        </div>
        <span className='mx-auto flex items-center'>
          {isNuriPool(pool) ? pool.symbol.split('-').slice(1, 3).join('-') : pool.symbol.split(' ')[0]}
        </span>
        <PoolDetails pool={pool} />
        <div className='col-span-2 row-start-2 flex flex-wrap gap-2 text-xs font-normal'>
          <span className='text-dark whitespace-nowrap rounded-sm bg-muted px-2 py-[0.125rem]'>
            {isNuriPool(pool) ? `${'Initial Fee: '}${pool.initialFee / Math.pow(10, 4)}${'%'}` : pool.title}
          </span>
          {isNuriPool(pool) && (
            <span className='text-dark whitespace-nowrap rounded-sm bg-muted px-2 py-[0.125rem]'>
              {`${'Current Fee: '}${pool.currentFee / Math.pow(10, 4)}${'%'}`}
            </span>
          )}
        </div>
      </AccordionTrigger>
    </AccordionItem>
  );
};

const TokenButton = ({
  token,
  automatedPool,
  onClick,
  sourceChainId,
  label,
}: {
  token?: Token;
  automatedPool: GammaPool[] | NuriPool[] | undefined;
  onClick: () => void;
  sourceChainId: ChainIds;
  label: string;
}) => (
  <Button
    variant='outline'
    className='h-10 justify-start text-left font-normal disabled:opacity-100'
    onClick={onClick}
  >
    <DrawerTrigger asChild={true}>
      <>
        {automatedPool && token && (
          <img
            className='mr-2 inline-block h-6 w-6 rounded-md border-none'
            src={getTokenLogoURI(token.address, CHAINS[sourceChainId])}
            alt=''
            width={24}
            height={24}
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = '/images/icons/unknown.png';
            }}
          />
        )}
        {automatedPool && token ? token.symbol : label}
      </>
    </DrawerTrigger>
  </Button>
);

const TokenIcons = ({ pool, sourceChainId }: { pool: GammaPool | NuriPool; sourceChainId: ChainIds }) => (
  <div className='relative flex'>
    <img
      loading='eager'
      src={getTokenLogoURI(pool.token0Address, CHAINS[sourceChainId])}
      alt=''
      width={20}
      height={20}
      className='z-10 w-10 rounded-full bg-white'
      onError={(e) => {
        (e.target as HTMLImageElement).onerror = null;
        (e.target as HTMLImageElement).src = '/images/icons/unknown.png';
      }}
    />
    <img
      loading='eager'
      src={getTokenLogoURI(pool.token1Address, CHAINS[sourceChainId])}
      alt=''
      width={20}
      height={20}
      className='absolute left-5 z-0 w-10 rounded-full bg-white'
      onError={(e) => {
        (e.target as HTMLImageElement).onerror = null;
        (e.target as HTMLImageElement).src = '/images/icons/unknown.png';
      }}
    />
  </div>
);

const PoolDetails = ({ pool }: { pool: GammaPool | NuriPool }) => (
  <>
    <div className='col-start-3 row-start-1 flex flex-col items-end justify-end gap-1 whitespace-nowrap text-right text-xs font-light sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:justify-start'>
      <span>TVL</span>
      <span className='text-black-muted text-sm font-normal md:text-base'>
        {pool.tvl ? formatNumber(pool.tvl) : '--'}
      </span>
    </div>
    <div className='col-start-3 row-start-2 flex flex-col items-end justify-end gap-1 whitespace-nowrap text-right text-xs font-light sm:col-start-4 sm:row-span-2 sm:row-start-1 sm:justify-start'>
      <span>Max APY</span>
      <span className='text-sm font-medium md:text-base'>{pool.apr ? formatNumber(pool.apr) : '--'}%</span>
    </div>
  </>
);

const selectTokens = (
  poolSelecter: GammaPool | NuriPool | undefined,
  setTokenA: (token: Token) => void,
  setTokenB: (token: Token) => void,
  sourceChainId: ChainIds,
) => {
  if (poolSelecter) {
    const tokens = Object.values(TOKEN_SYMBOL_MAP[sourceChainId] || {});
    setTokenA(tokens.find((token) => token.address.toLowerCase() === poolSelecter.token0Address.toLowerCase())!);
    setTokenB(tokens.find((token) => token.address.toLowerCase() === poolSelecter.token1Address.toLowerCase())!);
  }
};

const getPoolsData = () => [
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0x80137510979822322193fc997d400d5a6c747bf7',
    initialFee: 250,
  },
  {
    token0: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
    token1: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
    initialFee: 100,
  },
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
    initialFee: 3000,
  },
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0xf610a9dfb7c89644979b4a0f27063e9e7d7cda32',
    initialFee: 250,
  },
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0xa25b25548b4c98b0c7d3d27dca5d5ca743d68b7f',
    initialFee: 250,
  },
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df',
    initialFee: 3000,
  },
  {
    token0: '0x5300000000000000000000000000000000000004',
    token1: '0x01f0a31698c4d065659b9bdc21b3610292a1c506',
    initialFee: 250,
  },
];

const fetchNuriPairs = async () => {
  const response = await fetch(`https://nuri-api-production.up.railway.app/mixed-pairs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  return data.pairs;
};

const filterPools = (pools: Pool[], nuriPairList: any[]): NuriPool[] => {
  return nuriPairList
    .filter((nuriPair) =>
      pools.some(
        (pool) =>
          ((pool.token0.toLowerCase() === nuriPair.token0.toLowerCase() &&
            pool.token1.toLowerCase() === nuriPair.token1.toLowerCase()) ||
            (pool.token0.toLowerCase() === nuriPair.token1.toLowerCase() &&
              pool.token1.toLowerCase() === nuriPair.token0.toLowerCase())) &&
          pool.initialFee === Number(nuriPair.initialFee),
      ),
    )
    .map((nuriPair) => ({
      tvl: nuriPair.tvl,
      apr: nuriPair.lpApr,
      address: nuriPair.id,
      token0Address: nuriPair.token0,
      token1Address: nuriPair.token1,
      symbol: nuriPair.symbol,
      initialFee: parseInt(nuriPair.initialFee),
      currentFee: parseInt(nuriPair.feeTier),
      title: '',
    }));
};

const isNuriPool = (pool: GammaPool | NuriPool): pool is NuriPool => {
  return (pool as NuriPool).initialFee !== undefined;
};

export default PoolSelector;
