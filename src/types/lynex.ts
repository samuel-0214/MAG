// types.ts
export interface Gauge {
  apr: number;
  minApr: number;
  projectedApr: number;
  voteApr: number;
  totalSupply: number;
  address: string;
  fee: string;
  bribe: string;
  weight: number;
  bribes: string;
  isAlive: boolean;
  rewardPerSecond: number;
  tvl: number;
}

export interface Pool {
  extraRewards: any[];
  address: string;
  symbol: string;
  totalSupply: number;
  lpPrice: number;
  isGamma: boolean;
  type: string;
  title: string;
  gauge: Gauge;
  token0: { address: string; reserve: number };
  token1: { address: string; reserve: number };
}

export interface GammaPool {
  tvl: number;
  apr: number;
  address: string;
  token0Address: string;
  token1Address: string;
  symbol: string;
  type: string;
  isGamma: boolean;
  title: string;
}

export interface ApiResponse {
  success: boolean;
  data: Pool[];
}
