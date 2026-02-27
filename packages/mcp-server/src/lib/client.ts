import { AegisClient } from '@aegisaudit/sdk';

let clientInstance: AegisClient | null = null;

/**
 * Get or create the singleton AegisClient.
 *
 * Configuration is resolved from environment variables:
 *   AEGIS_CHAIN_ID    — defaults to 84532 (Base Sepolia)
 *   AEGIS_RPC_URL     — optional custom RPC endpoint
 *   AEGIS_REGISTRY    — optional explicit registry address
 */
export function getClient(): AegisClient {
  if (clientInstance) return clientInstance;

  const chainId = Number(process.env.AEGIS_CHAIN_ID ?? '84532');
  const rpcUrl = process.env.AEGIS_RPC_URL ?? undefined;
  const registryAddress = process.env.AEGIS_REGISTRY as `0x${string}` | undefined;

  clientInstance = new AegisClient({
    chainId,
    rpcUrl,
    registryAddress,
  });

  return clientInstance;
}
