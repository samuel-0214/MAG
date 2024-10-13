'use client';

import { getEvmConnectorId, getWallet } from '@/lib/walletUtils';
import {
  Account,
  ConnectedAccounts,
  ConnectedWallets,
  CurrentWallet,
  NetworkType,
  WALLET_ID,
  WalletContextValues,
  WalletData,
  WalletId,
  initialConnectedWallets,
} from '@/types/WalletContextTypes';
import {
  ConnectErrorType,
  ConnectorAlreadyConnectedError,
  GetConnectionsReturnType,
  ProviderNotFoundError,
} from '@wagmi/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useConnect, useConnections } from 'wagmi';
import { useTronContext } from './TronContext';
import { Adapter } from '@tronweb3/tronwallet-abstract-adapter';
import { WalletListModal } from '@/components/Wallet/WalletListModal';
import { AccountModal } from '@/components/Wallet/AccountModal';

const walletContextInitialValues: WalletContextValues = {
  currentAccount: undefined,
  currentWallet: undefined,
  connectedWallets: initialConnectedWallets,
  connectedAccounts: {},
  activeAccounts: {},
  currentEvmWalletConnector: undefined,
  connectWallet: (walletId: WalletId) => {},
  disconnectWallet: (walletId: string) => {},
  disconnectAllWallets: () => {},
  getAccountByNetwork: (network: NetworkType) => {},
  getAccount: (account: string) => {},
  getAccounts: () => {},
  setConnectedWallets: () => {},
  setConnectedAccounts: () => {},
  setCurrentAccount: () => {},
  setCurrentWallet: () => {},
  currentChainId: undefined,
  switchChain: (chainId: string) => {},
  openWalletModal: () => {},
};
const WalletContext = createContext<WalletContextValues>(walletContextInitialValues);

const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [connectedWallets, setConnectedWallets] = useLocalStorage<ConnectedWallets>(
    'mwc_connectedWallets',
    initialConnectedWallets,
  );
  const [connectedAccounts, setConnectedAccounts] = useLocalStorage<ConnectedAccounts>('mwc_connectedAccounts', {});
  const [currentWallet, setCurrentWallet] = useLocalStorage<CurrentWallet | undefined>('mwc_currentWallet', undefined);
  const [currentAccount, setCurrentAccount] = useLocalStorage<Account | undefined>('mwc_currentAccount', undefined);

  const [walletListOpen, setWalletListOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // wallet contexts
  const { connectors, connectAsync: wagmiConnectAsync } = useConnect();
  const { account: tronAccount, connect: tronConnect, disconnect: tronDisconnect, tronAdapter } = useTronContext();

  const currentChainId = useMemo(() => currentAccount?.chainId || undefined, [currentAccount?.chainId]);
  const currentEvmWalletConnector = useMemo(() => {
    return connectors.find((c) => c.id === currentWallet?.id);
  }, [connectors, currentWallet]);

  const evmconnections = useConnections();

  const handleWalletButtonClick = useCallback(() => {
    if (!currentAccount) {
      setWalletListOpen(true);
      return;
    }
    setAccountModalOpen(true);
  }, [currentAccount]);

  const handleEvmConnectionChanges = useCallback(
    async (connections: GetConnectionsReturnType | undefined) => {
      const _connectedAccounts: ConnectedAccounts = {};
      const _connectedWallets: Omit<ConnectedWallets, 'cosmos' | 'tron' | 'near'> = { evm: {} };

      if (!connections) {
        console.error('[WALLET] No EVM connections');
        setConnectedAccounts((curr) => ({
          ...curr,
          evm: { address: '', chainId: '', networkType: NetworkType.EVM, wallet: '' },
        }));
        setConnectedWallets((curr) => ({ ...curr, evm: {} }));
        return;
      }

      for (const c of connections) {
        if (c.accounts[0]) {
          _connectedWallets['evm'][c.connector.id as WalletId] = {
            address: c.accounts[0],
            loading: false,
            chainId: c.chainId?.toString(),
          };

          _connectedAccounts[c.connector.id as WalletId] = {
            wallet: c.connector.id as WalletId,
            address: c.accounts[0],
            chainId: c.chainId?.toString(),
            networkType: NetworkType.EVM,
          };

          // handle injected and wallet duplicates
          if (c.connector.id === 'injected') {
            const rdnsId: WalletId | undefined = await getEvmConnectorId(c.connector);

            if (rdnsId) {
              _connectedWallets['evm'][rdnsId] = {
                address: c.accounts[0],
                loading: false,
                chainId: c.chainId?.toString(),
              };
              _connectedAccounts[rdnsId] = {
                wallet: rdnsId,
                address: c.accounts[0],
                chainId: c.chainId?.toString(),
                networkType: NetworkType.EVM,
              };
            }
          }
        }
      }

      setConnectedAccounts((curr) => {
        const nonEvmAccounts = Object.values(curr)
          .filter((v) => v?.networkType !== NetworkType.EVM)
          .reduce((acc, v) => {
            acc[v?.wallet as WalletId] = v;
            return acc;
          }, {} as ConnectedAccounts);
        return { ...nonEvmAccounts, ..._connectedAccounts };
      });
      setConnectedWallets((curr) => ({ ...curr, ..._connectedWallets }));
    },
    [setConnectedAccounts, setConnectedWallets],
  );

  const handleTronConnectionChanges = useCallback(
    async (tronAdapter: Adapter | undefined) => {
      const _connectedAccounts: ConnectedAccounts = connectedAccounts;
      const _connectedWallets: ConnectedWallets = connectedWallets;

      if (tronAdapter?.address && _connectedWallets.tron) {
        // @ts-ignore
        const chainId = (await tronAdapter.network()).chainId;
        _connectedWallets['tron'][WALLET_ID.tronLink] = {
          address: tronAdapter.address,
          loading: false,
          chainId,
        };
        _connectedAccounts[WALLET_ID.tronLink] = {
          wallet: WALLET_ID.tronLink,
          address: tronAdapter.address,
          networkType: NetworkType.TRON,
          chainId,
        };
      }

      setConnectedAccounts((curr) => {
        const nonTronAccounts = Object.values(curr)
          .filter((v) => v?.networkType !== NetworkType.TRON)
          .reduce((acc, v) => {
            acc[v?.wallet as WalletId] = v;
            return acc;
          }, {} as ConnectedAccounts);
        return { ...nonTronAccounts, ..._connectedAccounts };
      });
      setConnectedWallets({ ...connectedWallets, ..._connectedWallets });
    },
    [connectedAccounts, connectedWallets, setConnectedAccounts, setConnectedWallets],
  );

  const handleWalletDisconnectChanges = useCallback(
    (currWallet: CurrentWallet | undefined) => {
      // if current wallet is truthy but no accounts are connected
      // only happens when wallet is disconnected
      if ((currWallet && !connectedAccounts[currWallet.id]) || !currWallet) {
        const [nextWallet] = (Object.entries(connectedAccounts).find(([w, d]) => !!d?.address) || []) as [
          WalletId,
          WalletData,
        ];
        console.info('[Wallet] Current wallet is disconnected', currWallet?.id);

        if (!nextWallet) {
          console.info('[Wallet] No connected wallets');
          setCurrentWallet(undefined);
          setCurrentAccount(undefined);
          return;
        }

        console.info('[Wallet] Connecting to ', nextWallet, connectedAccounts[nextWallet]);

        setCurrentWallet({ id: nextWallet, type: connectedAccounts[nextWallet]?.networkType! });
        setCurrentAccount(connectedAccounts[nextWallet]);
      } else if (currWallet) {
        console.info('[Wallet] Current wallet is connected', currWallet.id);

        setCurrentAccount(connectedAccounts[currWallet.id]);
      }
    },
    [connectedAccounts, setCurrentWallet, setCurrentAccount],
  );

  const handleWalletConnect = useCallback(
    async (walletId: WalletId) => {
      let wallet = getWallet(walletId);
      if (!wallet) {
        const connector = connectors.find((c) => c.id === walletId);
        if (connector) {
          wallet = {
            icon: connector.icon ?? '',
            id: walletId,
            name: connector.name,
            type: NetworkType.EVM,
            connector,
          };
        }
      }

      if (!wallet) {
        console.error('[Wallet] Wallet not found', walletId);
        return;
      }
      // if (connectedWallets[walletId]?.address && currentWallet === walletId) {
      //   console.info('[Wallet] Already connected', walletId, connectedWallets[walletId]);
      //   return;
      // }

      console.info('[Wallet] Connecting', walletId, wallet.type);

      let account: string = '',
        chainId: string = '';

      // if wallet id is supported by wagmi / is evm, use wagmiConnect
      if (wallet.type === NetworkType.EVM) {
        setConnectedWallets((v) => ({
          ...v,
          evm: {
            ...v.evm,
            [walletId]: { address: v[wallet!.type][walletId]?.address ?? '', loading: true, chainId: undefined },
          },
        }));

        const connector = connectors.find((c) => c.id === walletId);
        if (!connector) {
          console.error('[Wallet] Connector not found', walletId);
          return;
        }

        let accounts: string[] = [];

        if (connector.isAuthorized && (await connector.isAuthorized())) {
          console.info('[Wallet]', wallet.id, 'is authorized');

          accounts = (await connector.getAccounts()) as string[];
          chainId = (await connector.getChainId()).toString();
        } else {
          const data = await wagmiConnectAsync({ connector })
            .then((data) => {
              const { accounts } = data;
              const chainId = data.chainId?.toString();
              return { accounts: accounts as [string, ...string[]], chainId };
            })
            .catch(async (error: ConnectErrorType) => {
              if (error.name === ProviderNotFoundError.name) {
                // open modal to install provider
              } else if (error.name === ConnectorAlreadyConnectedError.name) {
                // get current account for provider
                const accounts = await connector.getAccounts();
                const chainId = await connector.getChainId();

                console.info('[Wallet] Already connected', walletId, accounts[0]);

                // return [accounts as [string, ...string[]], chainId.toString()];
                return { accounts: accounts as [string, ...string[]], chainId: chainId.toString() };
              } else {
                console.error('[Wallet] Error connecting wallet', error);
              }
              return { accounts: [], chainId: '' };
            });

          accounts = data.accounts;
          chainId = data.chainId;

          if (accounts.length === 0) {
            console.error('[Wallet] No accounts found');
            setConnectedWallets((v) => ({
              ...v,
              evm: { ...v.evm, [walletId]: { address: '', loading: false, chainId: undefined } },
            }));

            return;
          }
        }

        if (!accounts || accounts.length === 0) {
          console.error('[Wallet] No accounts found');

          setConnectedWallets((v) => ({
            ...v,
            evm: { ...v.evm, [walletId]: { address: '', loading: false, chainId: undefined } },
          }));
          return;
        }

        console.info('[Wallet] Connected', walletId, accounts[0]);

        account = accounts[0];
      } else if (wallet.type === NetworkType.COSMOS) {
      } else if (wallet.type === NetworkType.TRON) {
        setConnectedWallets((v) => ({
          ...v,
          tron: {
            ...v.tron,
            [walletId]: { address: v[wallet!.type][walletId]?.address ?? '', loading: true, chainId: undefined },
          },
        }));

        const tronaccount = await tronConnect();

        if (!tronaccount) {
          console.error('[Wallet] Error connecting to Tron wallet');
          setConnectedWallets((v) => ({ ...v, [walletId]: { address: '', loading: false } }));
          return;
        }

        console.info('[Wallet] Connected', walletId, tronaccount);

        account = tronaccount.account;
        chainId = tronaccount.chainId;
      }

      setCurrentAccount({
        address: account,
        networkType: wallet.type,
        wallet: walletId,
        chainId,
      });
      setCurrentWallet({ id: walletId, type: wallet.type });
      setConnectedAccounts((v) => ({
        ...v,
        [walletId]: { wallet: walletId, address: account, networkType: wallet!.type, chainId },
      }));
      setConnectedWallets((v) => ({
        ...v,
        [wallet!.type]: { ...v[wallet!.type], [walletId]: { address: account, chainId } },
      }));
    },
    [
      connectors,
      setConnectedAccounts,
      setConnectedWallets,
      setCurrentAccount,
      setCurrentWallet,
      tronConnect,
      wagmiConnectAsync,
    ],
  );

  const handleWalletDisconnect = useCallback(
    async (walletId: WalletId) => {
      console.info('[Wallet] Disconnecting', walletId);

      const _connectedAccounts = connectedAccounts;
      const _connectedWallets = connectedWallets;

      const walletData = getWallet(walletId);
      if (!walletData) {
        console.error('[Wallet] Wallet not found', walletId);
        return;
      }

      if (walletData.type === NetworkType.EVM) {
        const connector = connectors.find((c) => c.id === walletId);
        if (!connector) {
          console.error('[Wallet] Connector not found', walletId);
          return;
        }

        // handle injected and wallet duplicates
        // id of the canonical wallet for the injected wallet
        const injectedConnector = connectors.find((c) => c.id === 'injected');
        const injectedWalletId =
          _connectedWallets['evm']['injected'] && injectedConnector
            ? await getEvmConnectorId(injectedConnector)
            : undefined;

        // when the injected wallet is connected, disconnect the canonical wallet
        if (walletId === injectedWalletId) {
          console.info('[Wallet] Disconnecting canonical wallet', injectedWalletId);
          delete _connectedAccounts[injectedWalletId];
          delete _connectedWallets['evm'][injectedWalletId];
        }

        if (walletId === 'injected') {
          const _injectedWalletId = await getEvmConnectorId(connector);
          if (_injectedWalletId) {
            console.info('[Wallet] Disconnecting canonical wallet', _injectedWalletId);

            delete _connectedAccounts[walletId];
            delete _connectedWallets['evm'][walletId];
          }
        }

        await connector.disconnect();
      } else if (walletData.type === NetworkType.COSMOS) {
      } else if (walletData.type === NetworkType.TRON) {
        await tronDisconnect();
      }

      delete _connectedAccounts[walletId];
      delete _connectedWallets[walletData.type][walletId];

      setConnectedAccounts(_connectedAccounts);
      setConnectedWallets(_connectedWallets);

      const [nextWallet] = (Object.entries(connectedAccounts).find(([w, d]) => !!d?.address) || []) as [
        WalletId,
        WalletData,
      ];

      if (!nextWallet) {
        console.info('[Wallet] No connected wallets');
        setCurrentWallet(undefined);
        setCurrentAccount(undefined);
        return;
      }

      console.info('[Wallet] Connecting to ', nextWallet, connectedAccounts[nextWallet]);

      setCurrentWallet({ id: nextWallet, type: connectedAccounts[nextWallet]?.networkType! });
      setCurrentAccount(connectedAccounts[nextWallet]);

      console.info('[WALLET] disconnected', walletId);
    },
    [
      connectedAccounts,
      connectedWallets,
      connectors,
      setConnectedAccounts,
      setConnectedWallets,
      setCurrentAccount,
      setCurrentWallet,
      tronDisconnect,
    ],
  );

  useEffect(() => {
    console.log('[WALLET] EVM connections updated');
    handleEvmConnectionChanges(evmconnections);
  }, [evmconnections, handleEvmConnectionChanges]);

  useEffect(() => {
    console.log('[WALLET] Tron adapter updated');
    handleTronConnectionChanges(tronAdapter);
  }, [tronAdapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccountChanges = useCallback(
    ({
      connectedAccounts,
      currentAccount,
      currentWallet,
    }: {
      connectedAccounts: ConnectedAccounts;
      currentAccount: Account | undefined;
      currentWallet: CurrentWallet | undefined;
    }) => {
      if (currentWallet?.id) {
        // check if current wallet is not connected
        if (!connectedAccounts[currentWallet.id]) {
          // connect to the next connected wallet
          const [nextWallet] = (Object.entries(connectedAccounts).find(([w, d]) => !!d?.address) || []) as [
            WalletId,
            Account,
          ];
          console.info('[Wallet] Current wallet is disconnected', currentWallet?.id);

          if (!nextWallet) {
            console.info('[Wallet] No connected wallets');
            setCurrentWallet(undefined);
            setCurrentAccount(undefined);
          } else {
            console.info('[Wallet] Connecting to ', nextWallet, connectedAccounts[nextWallet]);

            setCurrentWallet({
              id: nextWallet,
              type: connectedAccounts[nextWallet]?.networkType!,
            });
            setCurrentAccount(connectedAccounts[nextWallet]);
          }
        }
        // check if current wallet's account is the same as the connected account
        if (
          connectedAccounts[currentWallet.id]?.address !== currentAccount?.address ||
          connectedAccounts[currentWallet.id]?.chainId !== currentAccount?.chainId
        ) {
          setCurrentAccount(connectedAccounts[currentWallet.id]);
        }

        return;
      }

      // if current wallet is undefined but there are connected accounts
      // set the current wallet to the first connected wallet
      if (!currentWallet && Object.keys(connectedAccounts).length > 0) {
        const [nextWallet] = (Object.entries(connectedAccounts).find(([w, d]) => !!d?.address) || []) as [
          WalletId,
          Account,
        ];
        console.info('[Wallet] No current wallet');

        if (!nextWallet) {
          console.info('[Wallet] No connected wallets');
          setCurrentWallet(undefined);
          setCurrentAccount(undefined);
        } else {
          console.info('[Wallet] Connecting to ', nextWallet, connectedAccounts[nextWallet]);

          setCurrentWallet({
            id: nextWallet,
            type: connectedAccounts[nextWallet]?.networkType!,
          });
          setCurrentAccount(connectedAccounts[nextWallet]);
        }

        return;
      }

      // if there are no connected wallets
      if (Object.keys(connectedAccounts).length === 0) {
        console.info('[Wallet] No connected wallets');
        setCurrentWallet(undefined);
        setCurrentAccount(undefined);
      }
    },
    [setCurrentAccount, setCurrentWallet],
  );
  useEffect(() => {
    console.log('[WALLET] Account changed');
    console.table(connectedAccounts);
    handleAccountChanges({
      connectedAccounts,
      currentAccount,
      currentWallet,
    });
  }, [handleAccountChanges, connectedAccounts, currentAccount, currentWallet]);

  useEffect(() => {
    if ((currentWallet && !connectedAccounts[currentWallet.id]) || !currentWallet)
      handleWalletDisconnectChanges(currentWallet);
  }, [connectedAccounts, currentWallet, handleWalletDisconnectChanges]);

  const switchChain = useCallback(
    async (chainId: string) => {
      if (!currentWallet) {
        console.error('[Wallet] No current wallet');
        return;
      }
      if (currentWallet?.type === NetworkType.EVM) {
        const connector = connectors.find((c) => c.id === currentWallet.id);
        if (!connector) {
          console.error('[Wallet] Connector not found', currentWallet.id);
          return;
        }

        if (connector.switchChain) {
          await connector.switchChain({ chainId: Number(chainId) }).catch((error) => {
            console.error('[Wallet] Error switching chain', error);
          });
        } else {
          console.error('[Wallet] Connector does not support chain switching');

          await connector.connect({ chainId: Number(chainId) }).catch((error) => {
            console.error('[Wallet] Error connecting and switching chain', error);
          });
        }
      }
    },
    [connectors, currentWallet],
  );

  return (
    <WalletContext.Provider
      value={{
        ...walletContextInitialValues,
        connectWallet: handleWalletConnect,
        disconnectWallet: handleWalletDisconnect,
        connectedWallets,
        connectedAccounts,
        currentEvmWalletConnector,
        currentAccount,
        currentWallet,
        currentChainId,
        switchChain,
        openWalletModal: handleWalletButtonClick,
      }}
    >
      <WalletListModal
        setOpen={(b) => setWalletListOpen(b)}
        open={walletListOpen}
      />

      <AccountModal
        open={accountModalOpen}
        setOpen={setAccountModalOpen}
        setWalletListOpen={setWalletListOpen}
      />

      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  return useContext(WalletContext);
};

export default WalletContextProvider;
