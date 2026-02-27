import type { Address } from './types';

export const CHAIN_CONFIG = {
  base: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
  },
  baseSepolia: {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
  },
} as const;

/**
 * Deployed contract addresses per chain.
 * Updated after each deployment.
 */
export const REGISTRY_ADDRESSES: Record<number, Address> = {
  // Base Sepolia
  84532: '0x851CfbB116aBdd50Ab899c35680eBd8273dD6Bba',
  // Base Mainnet — update after mainnet deployment
  // 8453: '0x...',
};

export const MIN_AUDITOR_STAKE = BigInt('10000000000000000'); // 0.01 ETH
export const MIN_DISPUTE_BOND = BigInt('5000000000000000'); // 0.005 ETH
export const REGISTRATION_FEE = BigInt('1000000000000000'); // 0.001 ETH
