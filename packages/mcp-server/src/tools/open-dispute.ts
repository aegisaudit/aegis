import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient, hasWallet, getWalletAddress } from '../lib/client.js';
import { handleToolCall, serializeResult } from '../lib/serialization.js';

export function registerOpenDispute(server: McpServer): void {
  server.tool(
    'open-dispute',
    'Open a dispute against a skill attestation on the AEGIS Protocol. Requires AEGIS_PRIVATE_KEY and a minimum bond of 0.005 ETH. If the auditor is found at fault, their stake is slashed and the bond is returned.',
    {
      skillHash: z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/)
        .describe('The bytes32 skill hash to dispute'),
      attestationIndex: z
        .number()
        .int()
        .min(0)
        .describe('Zero-based index of the attestation to dispute'),
      evidence: z
        .string()
        .regex(/^0x[0-9a-fA-F]+$/)
        .describe('Hex-encoded evidence bytes supporting the dispute'),
      bondEth: z
        .string()
        .describe('ETH bond amount (e.g. "0.01"). Minimum 0.005 ETH.'),
    },
    (params) =>
      handleToolCall(async () => {
        if (!hasWallet()) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: 'No wallet configured. Set AEGIS_PRIVATE_KEY in your MCP server env to enable write operations.',
                  setup: { env: { AEGIS_PRIVATE_KEY: '0x<your-private-key>' } },
                }),
              },
            ],
          };
        }

        const client = getClient();
        const bondWei = BigInt(
          Math.floor(parseFloat(params.bondEth) * 1e18),
        );

        const txHash = await client.openDispute(
          params.skillHash as `0x${string}`,
          params.attestationIndex,
          params.evidence as `0x${string}`,
          bondWei,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: serializeResult({
                success: true,
                transactionHash: txHash,
                skillHash: params.skillHash,
                attestationIndex: params.attestationIndex,
                bondEth: params.bondEth,
                walletAddress: getWalletAddress(),
                note: 'Dispute opened successfully. The bond will be returned if the auditor is found at fault.',
              }),
            },
          ],
        };
      }),
  );
}
