export const LayerZeroAbi = [
  {
    inputs: [
      { internalType: 'address', name: '_endpoint', type: 'address' },
      { internalType: 'address', name: '_nonceContract', type: 'address' },
      { internalType: 'uint16', name: '_localChainId', type: 'uint16' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'bytes', name: 'payload', type: 'bytes' }],
    name: 'Packet',
    type: 'event',
  },
];
