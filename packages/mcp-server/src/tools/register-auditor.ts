import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient, hasWallet, getWalletAddress } from '../lib/client.js';
import { handleToolCall, serializeResult } from '../lib/serialization.js';
import { getWalletSetupGuide } from '../lib/wallet-guide.js';

export function registerRegisterAuditor(server: McpServer): void {
  server.tool(
    'register-auditor',
    'Register as an anonymous auditor on the AEGIS Protocol by staking ETH. Requires AEGIS_PRIVATE_KEY to be set. Minimum stake is 0.01 ETH. If no wallet is configured, returns a step-by-step guide to help the user connect one.',
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
          const chainId = Number(process.env.AEGIS_CHAIN_ID ?? '84532');
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: 'No wallet configured. This operation requires a wallet with ETH to pay for gas and staking.',
                  action: 'Guide the user through connecting a wallet using the setup instructions below. They need to add AEGIS_PRIVATE_KEY to their MCP config and restart this client.',
                  walletSetupGuide: getWalletSetupGuide(chainId),
                }, null, 2),
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
