export const BenqiAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'unlockRequestedAt', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'shareAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'avaxAmount', type: 'uint256' },
    ],
    name: 'Redeem',
    type: 'event',
  },

  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'avaxAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'shareAmount', type: 'uint256' },
    ],
    name: 'Submitted',
    type: 'event',
  },
];
