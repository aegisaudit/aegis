import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import type { CLIConfig } from './config.js';

const CHAINS: Record<number, Chain> = {
  8453: base,
  84532: baseSepolia,
};

export function getPublicClient(config: CLIConfig): PublicClient {
  const chain = CHAINS[config.chainId];
  if (!chain) throw new Error(`Unsupported chain: ${config.chainId}`);

  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}

export function getWalletClient(
  config: CLIConfig,
): WalletClient<Transport, Chain, Account> {
  if (!config.privateKey) {
    throw new Error(
      'Private key required for write operations. Use --private-key or set AEGIS_PRIVATE_KEY env var.',
    );
  }

  const chain = CHAINS[config.chainId];
  if (!chain) throw new Error(`Unsupported chain: ${config.chainId}`);

  const account = privateKeyToAccount(config.privateKey);

  return createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });
}

export async function printWalletInfo(
  publicClient: PublicClient,
  walletClient: WalletClient<Transport, Chain, Account>,
): Promise<void> {
  const address = walletClient.account.address;
  const balance = await publicClient.getBalance({ address });
  console.log(`  Wallet: ${address}`);
  console.log(`  Balance: ${formatEther(balance)} ETH`);
}
