'use client';
import React from 'react';
import { Button } from './ui/button';
import { useWalletContext } from '@/context/WalletContext';
import { CHAINS, ChainIds } from '@/constants/chains';
import { capitalized, cn } from '@/lib/utils';

const TxButtons = ({
  label,
  className,
  isLoading,
  loadingLabel,
  isDisabled,
  isSubmitting,
  error,
  errorLabel,
  success,
  successLabel,
  handleTransaction,
  handleComplete,
  chainId,
}: {
  chainId: string;
  handleTransaction: () => void;
  handleComplete: () => void;
  label: string;
  className?: string;
  isLoading: boolean;
  loadingLabel?: string;
  isDisabled: boolean;
  isSubmitting: boolean;
  error: Error | null | undefined;
  errorLabel?: string;
  success: boolean;
  successLabel?: string;
}) => {
  const { switchChain, currentChainId, currentAccount, openWalletModal } = useWalletContext();

  if (error) {
    return (
      <Button
        className={cn('cursor-not-allowed opacity-75', className)}
        disabled={true}
      >
        {errorLabel ?? error.message}
      </Button>
    );
  }

  if (success) {
    return (
      <Button
        className={className}
        disabled={isDisabled}
        onClick={handleComplete}
      >
        {successLabel}
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button
        className={cn('animate-pulse cursor-not-allowed', className)}
        disabled={isDisabled}
      >
        {loadingLabel ?? 'Loading...'}
      </Button>
    );
  }

  if (!currentAccount) {
    return (
      <Button
        className={className}
        disabled={isDisabled}
        onClick={openWalletModal}
      >
        Connect Wallet
      </Button>
    );
  }

  if (chainId !== currentChainId) {
    return (
      <Button
        disabled={isDisabled}
        className={className}
        onClick={() => switchChain(chainId)}
      >
        {`Switch to ${capitalized(CHAINS[chainId as ChainIds])}`}
      </Button>
    );
  }

  return (
    <Button
      className={className}
      onClick={handleTransaction}
      disabled={isDisabled || isSubmitting}
    >
      {label}
    </Button>
  );
};

export default TxButtons;
