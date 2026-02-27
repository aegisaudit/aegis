import type { PublicClient, WalletClient, Transport, Chain, Account } from 'viem';
import type {
  AegisConfig,
  Address,
  Attestation,
  AuditorReputation,
  Hex,
  RegisterSkillParams,
} from './types';
import {
  createReadClient,
  getAttestations as _getAttestations,
  verifyAttestation as _verifyAttestation,
  getAuditorReputation as _getAuditorReputation,
  registerAuditor as _registerAuditor,
  registerSkill as _registerSkill,
  openDispute as _openDispute,
} from './registry';
import { REGISTRY_ADDRESSES } from './constants';

/**
 * High-level client for interacting with the AEGIS protocol.
 *
 * @example
 * ```ts
 * import { AegisClient } from '@aegis/sdk';
 *
 * const client = new AegisClient({
 *   chainId: 84532,
 *   registryAddress: '0x...',
 * });
 *
 * // Query attestations (read-only, no wallet needed)
 * const attestations = await client.getAttestations(skillHash);
 *
 * // Verify an attestation on-chain
 * const isValid = await client.verify(skillHash, 0);
 * ```
 */
export class AegisClient {
  private readonly config: AegisConfig & { registryAddress: Address };
  private readonly publicClient: PublicClient;
  private walletClient?: WalletClient<Transport, Chain, Account>;

  constructor(config: AegisConfig) {
    const registryAddress =
      config.registryAddress ?? REGISTRY_ADDRESSES[config.chainId];
    if (!registryAddress) {
      throw new Error(
        `No registry address for chain ${config.chainId}. Pass registryAddress explicitly.`,
      );
    }
    this.config = { ...config, registryAddress };
    this.publicClient = createReadClient(this.config);
  }

  /** Attach a wallet client for write operations */
  setWallet(walletClient: WalletClient<Transport, Chain, Account>): void {
    this.walletClient = walletClient;
  }

  private requireWallet(): WalletClient<Transport, Chain, Account> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations. Call setWallet() first.');
    }
    return this.walletClient;
  }

  // ──────────────────────────────────────────────
  //  Read Operations
  // ──────────────────────────────────────────────

  /** Get all attestations for a skill */
  async getAttestations(skillHash: Hex): Promise<Attestation[]> {
    return _getAttestations(this.publicClient, this.config.registryAddress, skillHash);
  }

  /** Verify an attestation's ZK proof on-chain */
  async verify(skillHash: Hex, attestationIndex: number): Promise<boolean> {
    return _verifyAttestation(
      this.publicClient,
      this.config.registryAddress,
      skillHash,
      BigInt(attestationIndex),
    );
  }

  /** Get an auditor's reputation data */
  async getAuditorReputation(auditorCommitment: Hex): Promise<AuditorReputation> {
    return _getAuditorReputation(this.publicClient, this.config.registryAddress, auditorCommitment);
  }

  // ──────────────────────────────────────────────
  //  Write Operations (require wallet)
  // ──────────────────────────────────────────────

  /** Register a skill with a verified attestation */
  async registerSkill(params: RegisterSkillParams): Promise<Hex> {
    return _registerSkill(this.requireWallet(), this.config.registryAddress, params);
  }

  /** Register as an anonymous auditor by staking ETH */
  async registerAuditor(auditorCommitment: Hex, stakeAmount: bigint): Promise<Hex> {
    return _registerAuditor(
      this.requireWallet(),
      this.config.registryAddress,
      auditorCommitment,
      stakeAmount,
    );
  }

  /** Open a dispute against a skill attestation */
  async openDispute(
    skillHash: Hex,
    attestationIndex: number,
    evidence: Hex,
    bond: bigint,
  ): Promise<Hex> {
    return _openDispute(
      this.requireWallet(),
      this.config.registryAddress,
      skillHash,
      BigInt(attestationIndex),
      evidence,
      bond,
    );
  }
}
