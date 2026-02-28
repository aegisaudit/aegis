# @aegisaudit/sdk

[![npm](https://img.shields.io/npm/v/@aegisaudit/sdk?color=FF3366)](https://www.npmjs.com/package/@aegisaudit/sdk)
[![license](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

TypeScript SDK for the AEGIS Protocol — query and interact with on-chain ZK skill attestations on Base.

## Install

```bash
npm install @aegisaudit/sdk
```

## Quick Start

```typescript
import { AegisClient } from '@aegisaudit/sdk';

// Create a read-only client (no wallet needed)
const client = new AegisClient({ chainId: 84532 });

// List all registered skills
const skills = await client.listAllSkills();
console.log(`${skills.length} skills registered`);

// Get attestations for a skill
const attestations = await client.getAttestations(skills[0].skillHash);

// Verify a ZK proof on-chain
const valid = await client.verify(skills[0].skillHash, 0);
console.log('Proof valid:', valid);

// Get skill metadata
const uri = await client.getMetadataURI(skills[0].skillHash);
```

## API Reference

### `new AegisClient(config)`

Create a client instance.

```typescript
const client = new AegisClient({
  chainId: 84532,           // Base Sepolia (default registry auto-resolved)
  rpcUrl: 'https://...',    // Optional custom RPC
  registryAddress: '0x...',  // Optional override
});
```

### Read Operations

These work without a wallet.

| Method | Description |
|---|---|
| `listAllSkills(options?)` | List all registered skills from on-chain events |
| `listAllAuditors(options?)` | List all registered auditors |
| `getAttestations(skillHash)` | Get all attestations for a specific skill |
| `verify(skillHash, index)` | Verify an attestation's ZK proof on-chain |
| `getAuditorReputation(commitment)` | Get an auditor's reputation data |
| `getMetadataURI(skillHash)` | Get the metadata URI for a skill |
| `listDisputes(options?)` | List opened disputes |
| `listResolvedDisputes(options?)` | List resolved disputes |

### Write Operations

These require a wallet via `client.setWallet(walletClient)`.

| Method | Description |
|---|---|
| `registerSkill(params)` | Register a skill with a verified attestation |
| `registerAuditor(commitment, stake)` | Register as an auditor by staking ETH |
| `addStake(commitment, amount)` | Add stake to an existing auditor registration |
| `openDispute(skillHash, index, evidence, bond)` | Dispute a skill attestation |

### Prover

Generate ZK attestation proofs locally.

```typescript
import { generateAttestation, loadProofFromFiles } from '@aegisaudit/sdk';

// Generate a proof in-process (requires WASM)
const result = await generateAttestation({
  skillHash: '0x...',
  auditorSecret: '0x...',
  score: 85,
  metadataHash: '0x...',
});

// Or load a pre-generated proof from files
const proof = await loadProofFromFiles('./proof', './vkey');
```

### IPFS Metadata

```typescript
import { fetchMetadata, uploadMetadata } from '@aegisaudit/sdk';

const metadata = await fetchMetadata('ipfs://Qm...');
```

### Constants

```typescript
import {
  CHAIN_CONFIG,         // { base, baseSepolia } chain configs
  REGISTRY_ADDRESSES,   // Registry contract addresses per chain
  DEPLOYMENT_BLOCKS,    // Block numbers for event scanning
  MIN_AUDITOR_STAKE,    // 0.01 ETH
  MIN_DISPUTE_BOND,     // 0.005 ETH
  REGISTRATION_FEE,     // 0.001 ETH
} from '@aegisaudit/sdk';
```

## Configuration

The `AegisConfig` type:

```typescript
interface AegisConfig {
  chainId: number;           // 84532 (Base Sepolia) or 8453 (Base)
  rpcUrl?: string;           // Custom RPC URL (defaults to public RPC)
  registryAddress?: Address; // Override registry address
}
```

## Links

- [AEGIS Protocol](https://aegisprotocol.tech)
- [GitHub](https://github.com/aegisaudit/aegis)
- [MCP Server](https://www.npmjs.com/package/@aegisaudit/mcp-server)

## License

MIT
