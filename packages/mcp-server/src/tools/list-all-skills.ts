import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient } from '../lib/client.js';
import { serializeResult, handleToolCall } from '../lib/serialization.js';

export function registerListAllSkills(server: McpServer): void {
  server.tool(
    'list-all-skills',
    'List all skills registered on the AEGIS Protocol by scanning on-chain SkillRegistered events. Returns skill hashes, audit levels, auditor commitments, and block info.',
    {
      fromBlock: z
        .string()
        .optional()
        .describe('Start block number as string (defaults to contract deployment block)'),
      toBlock: z
        .string()
        .optional()
        .describe('End block number as string (defaults to latest block)'),
    },
    async ({ fromBlock, toBlock }) => {
      return handleToolCall(async () => {
        const client = getClient();
        const skills = await client.listAllSkills({
          fromBlock: fromBlock ? BigInt(fromBlock) : undefined,
          toBlock: toBlock ? BigInt(toBlock) : undefined,
        });
        return {
          content: [{ type: 'text' as const, text: serializeResult(skills) }],
        };
      });
    },
  );
}
