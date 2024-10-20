import React, { useEffect } from 'react';

const useConfetti = () => {
  const [showConfetti, setShowConfetti] = React.useState(false);

  useEffect(() => {
    if (!showConfetti) return;

    const timeout = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [showConfetti]);
  return {
    showConfetti,
    setShowConfetti,
  };
};

export default useConfetti;
