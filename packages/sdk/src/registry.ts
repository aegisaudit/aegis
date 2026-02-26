import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  type PublicClient,
  type WalletClient,
  type GetContractReturnType,
  type Transport,
  type Chain,
  type Account,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import abi from './abi/AegisRegistry.json' with { type: 'json' };
import type { AegisConfig, Attestation, AuditorReputation, Hex, Address } from './types';
import { REGISTRATION_FEE } from './constants';

const CHAINS: Record<number, Chain> = {
  8453: base,
  84532: baseSepolia,
};

export function createReadClient(config: AegisConfig): PublicClient {
  const chain = CHAINS[config.chainId];
  if (!chain) throw new Error(`Unsupported chain: ${config.chainId}`);

  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}

export function getRegistryContract(
  client: PublicClient,
  address: Address,
): GetContractReturnType<typeof abi, PublicClient> {
  return getContract({
    address,
    abi,
    client,
  });
}

// ──────────────────────────────────────────────
//  Read Operations
// ──────────────────────────────────────────────

export async function getAttestations(
  client: PublicClient,
  registryAddress: Address,
  skillHash: Hex,
): Promise<Attestation[]> {
  const result = await client.readContract({
    address: registryAddress,
    abi,
    functionName: 'getAttestations',
    args: [skillHash],
  });

  return result as unknown as Attestation[];
}

export async function verifyAttestation(
  client: PublicClient,
  registryAddress: Address,
  skillHash: Hex,
  attestationIndex: bigint,
): Promise<boolean> {
  const result = await client.readContract({
    address: registryAddress,
    abi,
    functionName: 'verifyAttestation',
    args: [skillHash, attestationIndex],
  });

  return result as boolean;
}

export async function getAuditorReputation(
  client: PublicClient,
  registryAddress: Address,
  auditorCommitment: Hex,
): Promise<AuditorReputation> {
  const [score, totalStake, attestationCount] = (await client.readContract({
    address: registryAddress,
    abi,
    functionName: 'getAuditorReputation',
    args: [auditorCommitment],
  })) as [bigint, bigint, bigint];

  return { score, totalStake, attestationCount };
}

// ──────────────────────────────────────────────
//  Write Operations
// ──────────────────────────────────────────────

export async function registerAuditor(
  walletClient: WalletClient<Transport, Chain, Account>,
  registryAddress: Address,
  auditorCommitment: Hex,
  stakeAmount: bigint,
): Promise<Hex> {
  return walletClient.writeContract({
    address: registryAddress,
    abi,
    functionName: 'registerAuditor',
    args: [auditorCommitment],
    value: stakeAmount,
  });
}

export async function registerSkill(
  walletClient: WalletClient<Transport, Chain, Account>,
  registryAddress: Address,
  params: {
    skillHash: Hex;
    metadataURI: string;
    attestationProof: Hex;
    publicInputs: Hex[];
    auditorCommitment: Hex;
    auditLevel: number;
    fee?: bigint;
  },
): Promise<Hex> {
  return walletClient.writeContract({
    address: registryAddress,
    abi,
    functionName: 'registerSkill',
    args: [
      params.skillHash,
      params.metadataURI,
      params.attestationProof,
      params.publicInputs,
      params.auditorCommitment,
      params.auditLevel,
    ],
    value: params.fee ?? REGISTRATION_FEE,
  });
}

export async function openDispute(
  walletClient: WalletClient<Transport, Chain, Account>,
  registryAddress: Address,
  skillHash: Hex,
  attestationIndex: bigint,
  evidence: Hex,
  bond: bigint,
): Promise<Hex> {
  return walletClient.writeContract({
    address: registryAddress,
    abi,
    functionName: 'openDispute',
    args: [skillHash, attestationIndex, evidence],
    value: bond,
  });
}
