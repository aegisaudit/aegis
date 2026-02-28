import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient, hasWallet, getWalletAddress } from '../lib/client.js';
import { handleToolCall, serializeResult } from '../lib/serialization.js';

export function registerRegisterAuditor(server: McpServer): void {
  server.tool(
    'register-auditor',
    'Register as an anonymous auditor on the AEGIS Protocol by staking ETH. Requires AEGIS_PRIVATE_KEY to be set. Minimum stake is 0.01 ETH.',
    {
      auditorCommitment: z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/)
        .describe('The auditor bytes32 Pedersen commitment hash'),
      stakeEth: z
        .string()
        .describe('Amount of ETH to stake (e.g. "0.05"). Minimum 0.01 ETH.'),
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
        const stakeWei = BigInt(
          Math.floor(parseFloat(params.stakeEth) * 1e18),
        );

        const txHash = await client.registerAuditor(
          params.auditorCommitment as `0x${string}`,
          stakeWei,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: serializeResult({
                success: true,
                transactionHash: txHash,
                auditorCommitment: params.auditorCommitment,
                stakeEth: params.stakeEth,
                walletAddress: getWalletAddress(),
                note: 'Auditor registered successfully. Your commitment hash is your anonymous identity on the protocol.',
              }),
            },
          ],
        };
      }),
  );
}
