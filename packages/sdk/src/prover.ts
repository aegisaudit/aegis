/**
 * ZK Proof generation module.
 *
 * Provides three approaches for generating AEGIS attestation proofs:
 *
 * 1. **JS-native** (generateAttestation): Uses @noir-lang/noir_js + @aztec/bb.js
 *    to generate proofs entirely in JavaScript. Requires the caller to provide
 *    pre-computed Pedersen hashes as public inputs.
 *    NOTE: WASM proving is not available on Windows. Use CLI-based approach instead.
 *
 * 2. **CLI-based** (generateAttestationViaCLI): Shells out to nargo + bb CLI
 *    tools (via WSL on Windows). Most reliable approach for all platforms.
 *
 * 3. **Load from files** (loadProofFromFiles): Reads pre-generated proof and
 *    public inputs from binary files (output of bb prove).
 *
 * Peer dependencies (for JS-native approach):
 *   pnpm add @noir-lang/noir_js@1.0.0-beta.18 @aztec/bb.js@3.0.0-nightly.20260102
 */

import type { Hex } from './types';

export interface ProofResult {
  /** Serialized proof bytes as hex */
  proof: Hex;
  /** Public inputs for on-chain verification as bytes32[] */
  publicInputs: Hex[];
}

export interface ProveAttestationParams {
  /** Source code field elements (64 fields) */
  sourceCode: string[];
  /** Audit result field elements (32 fields) */
  auditResults: string[];
  /** Auditor's private key field element */
  auditorPrivateKey: string;
  /** Pre-computed Pedersen hash of sourceCode (public input) */
  skillHash: string;
  /** Pre-computed Pedersen hash of auditResults (public input) */
  criteriaHash: string;
  /** Audit level: 1, 2, or 3 (public input) */
  auditLevel: number;
  /** Pre-computed Pedersen hash of [auditorPrivateKey] (public input) */
  auditorCommitment: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompiledCircuit = { bytecode: string; abi: any };

/**
 * Convert a Uint8Array to a hex string.
 */
function toHex(bytes: Uint8Array): Hex {
  return ('0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')) as Hex;
}

/**
 * Pad a hex string to bytes32 (64 hex chars after 0x).
 */
function toBytes32(input: string): Hex {
  const clean = input.startsWith('0x') ? input.slice(2) : input;
  return ('0x' + clean.padStart(64, '0')) as Hex;
}

/**
 * Generate a ZK attestation proof using JS-native Noir execution.
 *
 * The caller MUST provide correct pre-computed Pedersen hashes as public inputs.
 * If the hashes don't match the private inputs, the circuit execution will fail
 * with an assertion error.
 *
 * @param circuit - The compiled circuit artifact (attestation.json from nargo compile)
 * @param params - All circuit inputs (private + public)
 * @returns Proof and public inputs formatted for on-chain verification
 *
 * @example
 * ```ts
 * import circuit from '../circuits/target/attestation.json';
 * const result = await generateAttestation(circuit, {
 *   sourceCode: Array(64).fill('1'),
 *   auditResults: Array(32).fill('1'),
 *   auditorPrivateKey: '12345',
 *   skillHash: '0x...', // pedersen_hash(sourceCode)
 *   criteriaHash: '0x...', // pedersen_hash(auditResults)
 *   auditLevel: 1,
 *   auditorCommitment: '0x...', // pedersen_hash([auditorPrivateKey])
 * });
 * ```
 */
export async function generateAttestation(
  circuit: CompiledCircuit,
  params: ProveAttestationParams,
): Promise<ProofResult> {
  // Dynamic imports to avoid hard dependency for read-only consumers
  let NoirClass: new (circuit: CompiledCircuit) => {
    init(): Promise<void>;
    execute(inputs: Record<string, unknown>): Promise<{ witness: Map<number, string> }>;
  };
  let UltraHonkBackendClass: new (
    bytecode: string,
    options?: { threads?: number },
  ) => {
    generateProof(
      witness: Map<number, string>,
      options?: { keccak?: boolean },
    ): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
    destroy(): Promise<void>;
  };

  try {
    const noirModule = await (Function('return import("@noir-lang/noir_js")')() as Promise<
      Record<string, unknown>
    >);
    NoirClass = noirModule.Noir as typeof NoirClass;
  } catch {
    throw new Error(
      '@noir-lang/noir_js is required for proof generation. Install: pnpm add @noir-lang/noir_js@1.0.0-beta.18',
    );
  }

  try {
    const bbModule = await (Function('return import("@aztec/bb.js")')() as Promise<
      Record<string, unknown>
    >);
    UltraHonkBackendClass = bbModule.UltraHonkBackend as typeof UltraHonkBackendClass;
  } catch {
    throw new Error(
      '@aztec/bb.js is required for proof generation. Install: pnpm add @aztec/bb.js@3.0.0-nightly.20260102',
    );
  }

  // 1. Execute the circuit to generate witness
  const noir = new NoirClass(circuit);
  const { witness } = await noir.execute({
    source_code: params.sourceCode,
    audit_results: params.auditResults,
    auditor_private_key: params.auditorPrivateKey,
    skill_hash: params.skillHash,
    criteria_hash: params.criteriaHash,
    audit_level: String(params.auditLevel),
    auditor_commitment: params.auditorCommitment,
  });

  // 2. Generate UltraHonk proof with keccak (required for Solidity verifier)
  const backend = new UltraHonkBackendClass(circuit.bytecode, { threads: 1 });
  try {
    const { proof, publicInputs } = await backend.generateProof(witness, { keccak: true });

    // 3. Format for on-chain submission
    return {
      proof: toHex(proof),
      publicInputs: publicInputs.map(toBytes32),
    };
  } finally {
    await backend.destroy();
  }
}

// ─── CLI-based proof generation ───────────────────────────────────────

export interface CLIProveOptions {
  /** Path to the circuits package directory (containing Nargo.toml) */
  circuitsDir: string;
  /** If true, run nargo/bb via WSL (required on Windows). Default: auto-detect. */
  useWSL?: boolean;
  /** WSL distribution name. Default: 'Ubuntu' */
  wslDistro?: string;
  /** Custom Prover.toml content. If not provided, uses existing Prover.toml. */
  proverToml?: string;
}

/**
 * Generate a ZK attestation proof using the nargo + bb CLI tools.
 *
 * This is the recommended approach on Windows where the WASM-based prover
 * is not available. Requires nargo and bb to be installed (in WSL on Windows).
 *
 * The function:
 * 1. Optionally writes a Prover.toml with the provided inputs
 * 2. Runs `nargo execute` to generate the witness
 * 3. Runs `bb prove --verifier_target evm` to generate the proof
 * 4. Reads the proof and public_inputs files and returns formatted results
 *
 * @example
 * ```ts
 * const result = await generateAttestationViaCLI({
 *   circuitsDir: '/path/to/packages/circuits',
 *   proverToml: buildProverToml({
 *     sourceCode: Array(64).fill('1'),
 *     auditResults: Array(32).fill('1'),
 *     auditorPrivateKey: '12345',
 *     skillHash: '0x0eba...',
 *     criteriaHash: '0x1c55...',
 *     auditLevel: 1,
 *     auditorCommitment: '0x1a65...',
 *   }),
 * });
 * ```
 */
export async function generateAttestationViaCLI(
  options: CLIProveOptions,
): Promise<ProofResult> {
  const { execSync } = await import('child_process');
  const { readFileSync, writeFileSync } = await import('fs');
  const { join } = await import('path');

  const isWindows = process.platform === 'win32';
  const useWSL = options.useWSL ?? isWindows;
  const distro = options.wslDistro ?? 'Ubuntu';
  const circuitsDir = options.circuitsDir;

  // Write Prover.toml if provided
  if (options.proverToml) {
    writeFileSync(join(circuitsDir, 'Prover.toml'), options.proverToml, 'utf-8');
  }

  // Helper to run a command (via WSL if needed)
  const run = (cmd: string): string => {
    if (useWSL) {
      // Convert Windows path to WSL path
      const wslPath = circuitsDir
        .replace(/\\/g, '/')
        .replace(/^([A-Za-z]):/, (_m, d: string) => `/mnt/${d.toLowerCase()}`);
      const fullCmd = `wsl -d ${distro} -- bash -lc "export PATH=\\$HOME/.nargo/bin:\\$HOME/.bb:\\$PATH && cd ${wslPath} && ${cmd}"`;
      return execSync(fullCmd, { encoding: 'utf-8', timeout: 120_000 });
    }
    return execSync(cmd, {
      cwd: circuitsDir,
      encoding: 'utf-8',
      timeout: 120_000,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.nargo/bin:${process.env.HOME}/.bb:${process.env.PATH}`,
      },
    });
  };

  // Step 1: Generate witness
  run('nargo execute');

  // Step 2: Generate proof
  run('bb prove -b ./target/attestation.json -w ./target/attestation.gz -o ./target --verifier_target evm');

  // Step 3: Read proof and public inputs
  const targetDir = join(circuitsDir, 'target');
  return loadProofFromFiles(
    join(targetDir, 'proof'),
    join(targetDir, 'public_inputs'),
  );
}

/**
 * Load a proof and public inputs from binary files (output of `bb prove`).
 *
 * @param proofPath - Path to the proof binary file
 * @param publicInputsPath - Path to the public_inputs binary file
 * @returns Proof and public inputs formatted for on-chain verification
 *
 * @example
 * ```ts
 * const result = loadProofFromFiles(
 *   './packages/circuits/target/proof',
 *   './packages/circuits/target/public_inputs',
 * );
 * console.log(result.proof); // 0x...
 * console.log(result.publicInputs); // ['0x...', '0x...', '0x...', '0x...']
 * ```
 */
export async function loadProofFromFiles(
  proofPath: string,
  publicInputsPath: string,
): Promise<ProofResult> {
  const fs = await import('fs');

  const proofBytes = fs.readFileSync(proofPath);
  const publicInputsBytes = fs.readFileSync(publicInputsPath);

  // Parse public inputs: each is a 32-byte field element
  const numInputs = publicInputsBytes.length / 32;
  const publicInputs: Hex[] = [];
  for (let i = 0; i < numInputs; i++) {
    const slice = publicInputsBytes.subarray(i * 32, (i + 1) * 32);
    publicInputs.push(toHex(slice));
  }

  return {
    proof: toHex(proofBytes),
    publicInputs,
  };
}

// ─── Prover.toml builder ──────────────────────────────────────────────

/**
 * Build a Prover.toml string from attestation parameters.
 *
 * @example
 * ```ts
 * const toml = buildProverToml({
 *   sourceCode: Array.from({length: 64}, (_, i) => String(i + 1)),
 *   auditResults: Array(32).fill('1'),
 *   auditorPrivateKey: '12345',
 *   skillHash: '0x0eba0c96...',
 *   criteriaHash: '0x1c5562cc...',
 *   auditLevel: 1,
 *   auditorCommitment: '0x1a65fb21...',
 * });
 * ```
 */
export function buildProverToml(params: ProveAttestationParams): string {
  const lines: string[] = [];

  // Format array fields as TOML arrays
  lines.push(`source_code = [${params.sourceCode.map((v) => `"${v}"`).join(', ')}]`);
  lines.push(`audit_results = [${params.auditResults.map((v) => `"${v}"`).join(', ')}]`);
  lines.push(`auditor_private_key = "${params.auditorPrivateKey}"`);
  lines.push(`skill_hash = "${params.skillHash}"`);
  lines.push(`criteria_hash = "${params.criteriaHash}"`);
  lines.push(`audit_level = "${params.auditLevel}"`);
  lines.push(`auditor_commitment = "${params.auditorCommitment}"`);

  return lines.join('\n') + '\n';
}
