import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient } from '../lib/client.js';
import { handleToolCall } from '../lib/serialization.js';

export function registerVerifyAttestation(server: McpServer): void {
  server.tool(
    'verify-attestation',
    "Verify an attestation's ZK proof on-chain via the UltraHonk verifier. Returns true if the proof is valid.",
    {
      skillHash: z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/)
        .describe('The bytes32 skill hash'),
      attestationIndex: z
        .number()
        .int()
        .min(0)
        .describe('Zero-based index of the attestation to verify'),
    },
    async ({ skillHash, attestationIndex }) => {
      return handleToolCall(async () => {
        const client = getClient();
        const isValid = await client.verify(skillHash as `0x${string}`, attestationIndex);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ valid: isValid }) }],
        };
      });
    },
  );
}
