// Client
export { AegisClient } from './client';

// Types
export type {
  Attestation,
  AuditorReputation,
  DisputeInfo,
  AegisConfig,
  RegisterSkillParams,
  SubmitAttestationParams,
  Hex,
  Address,
} from './types';

// Prover
export {
  generateAttestation,
  generateAttestationViaCLI,
  loadProofFromFiles,
  buildProverToml,
} from './prover';
export type { ProofResult, ProveAttestationParams, CLIProveOptions } from './prover';

// IPFS
export { fetchMetadata, uploadMetadata } from './ipfs';
export type { SkillMetadata } from './ipfs';

// Constants
export { CHAIN_CONFIG, REGISTRY_ADDRESSES, MIN_AUDITOR_STAKE, MIN_DISPUTE_BOND, REGISTRATION_FEE } from './constants';
