import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient, hasWallet, getWalletAddress } from '../lib/client.js';
import { handleToolCall, serializeResult } from '../lib/serialization.js';

export function registerAddStake(server: McpServer): void {
  server.tool(
    'add-stake',
    'Add more ETH stake to an existing auditor registration on the AEGIS Protocol. Requires AEGIS_PRIVATE_KEY to be set.',
    {
      auditorCommitment: z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/)
        .describe('The auditor bytes32 Pedersen commitment hash'),
      amountEth: z
        .string()
        .describe('Amount of ETH to add (e.g. "0.1")'),
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
        const amountWei = BigInt(
          Math.floor(parseFloat(params.amountEth) * 1e18),
        );

        const txHash = await client.addStake(
          params.auditorCommitment as `0x${string}`,
          amountWei,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: serializeResult({
                success: true,
                transactionHash: txHash,
                auditorCommitment: params.auditorCommitment,
                addedEth: params.amountEth,
                walletAddress: getWalletAddress(),
                note: 'Stake added successfully. Higher stake increases auditor reputation score.',
              }),
            },
          ],
        };
      }),
  );
}
