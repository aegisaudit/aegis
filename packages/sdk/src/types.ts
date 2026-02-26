export type Hex = `0x${string}`;
export type Address = `0x${string}`;

export interface Attestation {
  skillHash: Hex;
  auditCriteriaHash: Hex;
  zkProof: Hex;
  auditorCommitment: Hex;
  stakeAmount: bigint;
  timestamp: bigint;
  auditLevel: number;
}

export interface AuditorReputation {
  score: bigint;
  totalStake: bigint;
  attestationCount: bigint;
}

export interface DisputeInfo {
  skillHash: Hex;
  attestationIndex: bigint;
  evidence: Hex;
  challenger: Address;
  bond: bigint;
  resolved: boolean;
  auditorFault: boolean;
}

export interface AegisConfig {
  /** Target chain ID (8453 for Base, 84532 for Base Sepolia) */
  chainId: number;
  /** AegisRegistry contract address */
  registryAddress: Address;
  /** RPC URL (optional — defaults to public RPC for the chain) */
  rpcUrl?: string;
}

export interface RegisterSkillParams {
  skillHash: Hex;
  metadataURI: string;
  attestationProof: Hex;
  publicInputs: Hex[];
  auditorCommitment: Hex;
  auditLevel: 1 | 2 | 3;
  fee?: bigint;
}

export interface SubmitAttestationParams {
  sourceCode: Uint8Array;
  auditResults: Uint8Array;
  auditorPrivateKey: string;
  skillHash: Hex;
  auditLevel: 1 | 2 | 3;
  metadataURI: string;
}
