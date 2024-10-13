// https://coins.llama.fi/block/${CHAINS[destChainId as ChainIds]}/${srcTxTimestamp.toString()}

import { ChainIds, CHAINS } from '@/constants/chains';

export async function POST(request: Request) {
  const { timestamp, chainId } = await request.json();

  const blockNumber = await fetch(`https://coins.llama.fi/block/${CHAINS[chainId as ChainIds]}/${timestamp}`).then(
    (res) => res.json(),
  );

  return Response.json(blockNumber);
}
