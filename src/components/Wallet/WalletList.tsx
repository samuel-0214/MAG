import { Button } from '@/components/ui/button';
import { ChainIds } from '@/constants/chains';
import { CHAINS_DATA } from '@/constants/chains/list';
import { useWalletContext } from '@/context/WalletContext';
import { getWallet } from '@/lib/walletUtils';
import { WalletData, WalletId } from '@/types/WalletContextTypes';
import Image from 'next/image';

const WalletList = ({ showNetwork }: { showNetwork?: boolean }) => {
  const { currentAccount, connectedWallets, connectWallet, currentWallet, disconnectWallet } = useWalletContext();

  return (
    <>
      {/* {Object.entries(connectedWallets).map(([networkType, wallets]) => */}
      <span className='my-1 mt-2 text-sm'>Ethereum</span>
      {Object.entries(connectedWallets.evm)
        .filter(([walletId, data]) => data?.address)
        .map(([walletId, data]) => (
          <WalletListItem
            walletId={walletId as WalletId}
            walletData={data as WalletData}
            showNetwork={showNetwork}
            key={walletId}
          />
        ))}

      <hr />
      <span className='my-1 mt-2 text-sm'>Tron</span>
      {Object.entries(connectedWallets.tron)
        .filter(([walletId, data]) => data?.address)
        .map(([walletId, data]) => (
          <WalletListItem
            walletId={walletId as WalletId}
            walletData={data as WalletData}
            showNetwork={showNetwork}
            key={walletId}
          />
        ))}

      <hr />
      <span className='my-1 mt-2 text-sm'>Near</span>
      {Object.entries(connectedWallets.near)
        .filter(([walletId, data]) => data?.address)
        .map(([walletId, data]) => (
          <WalletListItem
            walletId={walletId as WalletId}
            walletData={data as WalletData}
            showNetwork={showNetwork}
            key={walletId}
          />
        ))}

      <hr />
      <span className='my-1 mt-2 text-sm'>Cosmos</span>
      {Object.entries(connectedWallets.cosmos)
        .filter(([walletId, data]) => data?.address)
        .map(([walletId, data]) => (
          <WalletListItem
            walletId={walletId as WalletId}
            walletData={data as WalletData}
            showNetwork={showNetwork}
            key={walletId}
          />
        ))}
    </>
  );
};

export const WalletListItem = ({
  walletId,
  walletData,
  showNetwork,
}: {
  walletId: WalletId;
  walletData: WalletData;
  showNetwork?: boolean;
}) => {
  const { currentAccount, connectedWallets, connectWallet, currentWallet, disconnectWallet } = useWalletContext();

  return (
    <Button
      variant='ghost'
      key={walletId}
      // disabled={getWallet(walletId as WalletId)?.disabled || !getWallet(walletId as WalletId)}
      onClick={() => connectWallet(walletId as WalletId)}
      className='relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none hover:bg-accent aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
    >
      <Image
        className='h-6 w-6 rounded-[0.5rem] '
        alt=''
        src={getWallet(walletId as WalletId)?.icon || '/images/icons/unknown.png'}
        width={128}
        height={128}
      />
      <span>{getWallet(walletId as WalletId)?.name}</span>

      <span className='ml-auto'></span>

      {currentAccount?.address === walletData?.address && currentWallet?.id === walletId && (
        <span className='h-2 w-2 rounded-sm bg-green-400 p-1 outline outline-2 outline-offset-2 outline-green-800' />
      )}

      {showNetwork && walletData?.chainId && (
        <span className='rounded-xs bg-neutral-700 px-2 py-1 font-mono text-xs'>
          {CHAINS_DATA[walletData.chainId as ChainIds]?.name ?? walletData.chainId}
        </span>
      )}

      {walletData?.address && (
        <span className='rounded-xs bg-neutral-700 px-2 py-1 font-mono text-xs'>
          {walletData?.address.slice(0, 6)}...
          {walletData?.address.slice(-4)}
        </span>
      )}
    </Button>
  );
};

export default WalletList;
