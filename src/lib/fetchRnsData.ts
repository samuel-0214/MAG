import { TAGZZ_RNS_URI } from '@/constants';
import { RNSData } from '@/types/intents';

export const fetchAddressData = async (address: string): Promise<RNSData> => {
  const response = await fetch(`${TAGZZ_RNS_URI}/resolve?address=${address}`);

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
};
