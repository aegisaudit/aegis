import { useChainId } from 'wagmi';
import { REGISTRY_ADDRESS } from '../config';
import type { Address } from 'viem';

export function useRegistryAddress(): Address | undefined {
  const chainId = useChainId();
  return REGISTRY_ADDRESS[chainId];
}
