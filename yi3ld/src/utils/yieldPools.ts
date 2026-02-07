export interface YieldPool {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  minDeposit: number;
  icon: string;
  features: string[];
  contractAddress?: string;
}

export const YIELD_POOLS: YieldPool[] = [
  {
    id: 'aave-eth-conservative',
    name: 'Conservative',
    protocol: 'Aave V3',
    chain: 'Ethereum',
    apy: 3.5,
    tvl: 2000000000,
    riskLevel: 'low',
    description: 'Maximum security with Ethereum mainnet',
    minDeposit: 100,
    icon: '🛡️',
    features: [
      'Highest security',
      'Maximum liquidity',
      'Battle-tested protocol',
      'Instant withdrawals'
    ],
    contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
  },
  {
    id: 'aave-base-balanced',
    name: 'Balanced',
    protocol: 'Aave V3',
    chain: 'Base',
    apy: 7.2,
    tvl: 150000000,
    riskLevel: 'low',
    description: 'Best balance of yield and security',
    minDeposit: 50,
    icon: '⚖️',
    features: [
      'Higher yields',
      'Low transaction fees',
      'Fast settlements',
      'Coinbase-backed'
    ],
    contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5'
  },
  {
    id: 'morpho-aggressive',
    name: 'Aggressive',
    protocol: 'Morpho Blue',
    chain: 'Ethereum',
    apy: 9.8,
    tvl: 400000000,
    riskLevel: 'medium',
    description: 'Maximum yield with peer-to-peer matching',
    minDeposit: 500,
    icon: '🚀',
    features: [
      'Highest APY',
      'Optimized rates',
      'Peer-to-peer matching',
      'Growing protocol'
    ],
    contractAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb'
  }
];

export const getPoolById = (id: string): YieldPool | undefined => {
  return YIELD_POOLS.find(pool => pool.id === id);
};

export const getPoolsByRisk = (risk: 'low' | 'medium' | 'high'): YieldPool[] => {
  return YIELD_POOLS.filter(pool => pool.riskLevel === risk);
};