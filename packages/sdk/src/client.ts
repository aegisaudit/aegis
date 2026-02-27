import type { PublicClient, WalletClient, Transport, Chain, Account } from 'viem';
import type {
  AegisConfig,
  Address,
  Attestation,
  AuditorReputation,
  Hex,
  RegisterSkillParams,
  SkillRegisteredEvent,
  AuditorRegisteredEvent,
  DisputeOpenedEvent,
  DisputeResolvedEvent,
} from './types';
import {
  createReadClient,
  getAttestations as _getAttestations,
  verifyAttestation as _verifyAttestation,
  getAuditorReputation as _getAuditorReputation,
  getMetadataURI as _getMetadataURI,
  listAllSkills as _listAllSkills,
  listAllAuditors as _listAllAuditors,
  listDisputes as _listDisputes,
  listResolvedDisputes as _listResolvedDisputes,
  registerAuditor as _registerAuditor,
  addStake as _addStake,
  registerSkill as _registerSkill,
  openDispute as _openDispute,
  resolveDispute as _resolveDispute,
} from './registry';
import { REGISTRY_ADDRESSES } from './constants';

/**
 * High-level client for interacting with the AEGIS protocol.
 *
 * Read operations work out of the box — just provide a chainId.
 * Write operations require a wallet via setWallet().
 *
 * @example
 * ```ts
 * import { AegisClient } from '@aegisaudit/sdk';
 *
 * const client = new AegisClient({ chainId: 84532 });
 *
 * // Discover all registered skills
 * const skills = await client.listAllSkills();
 *
 * // Query attestations for a specific skill
 * const attestations = await client.getAttestations(skills[0].skillHash);
 *
 * // Verify an attestation's ZK proof on-chain
 * const isValid = await client.verify(skills[0].skillHash, 0);
 *
 * // Get skill metadata
 * const uri = await client.getMetadataURI(skills[0].skillHash);
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

  /** Get the metadata URI for a registered skill */
  async getMetadataURI(skillHash: Hex): Promise<string> {
    return _getMetadataURI(this.publicClient, this.config.registryAddress, skillHash);
  }

  // ──────────────────────────────────────────────
  //  Discovery — browse skills, auditors, disputes
  // ──────────────────────────────────────────────

  /**
   * List all registered skills by scanning on-chain events.
   * Returns every SkillRegistered event with hash, level, auditor, and tx info.
   */
  async listAllSkills(
    options?: { fromBlock?: bigint; toBlock?: bigint },
  ): Promise<SkillRegisteredEvent[]> {
    return _listAllSkills(this.publicClient, this.config.registryAddress, options);
  }

  /**
   * List all registered auditors by scanning on-chain events.
   */
  async listAllAuditors(
    options?: { fromBlock?: bigint; toBlock?: bigint },
  ): Promise<AuditorRegisteredEvent[]> {
    return _listAllAuditors(this.publicClient, this.config.registryAddress, options);
  }

  /**
   * List all opened disputes. Optionally filter by skillHash.
   */
  async listDisputes(
    options?: { skillHash?: Hex; fromBlock?: bigint; toBlock?: bigint },
  ): Promise<DisputeOpenedEvent[]> {
    return _listDisputes(this.publicClient, this.config.registryAddress, options);
  }

  /**
   * List all resolved disputes.
   */
  async listResolvedDisputes(
    options?: { fromBlock?: bigint; toBlock?: bigint },
  ): Promise<DisputeResolvedEvent[]> {
    return _listResolvedDisputes(this.publicClient, this.config.registryAddress, options);
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

  /** Add more stake to an existing auditor registration */
  async addStake(auditorCommitment: Hex, amount: bigint): Promise<Hex> {
    return _addStake(
      this.requireWallet(),
      this.config.registryAddress,
      auditorCommitment,
      amount,
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

  /** Resolve a dispute (contract owner only) */
  async resolveDispute(disputeId: bigint, auditorFault: boolean): Promise<Hex> {
    return _resolveDispute(
      this.requireWallet(),
      this.config.registryAddress,
      disputeId,
      auditorFault,
    );
  }
}
