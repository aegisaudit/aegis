import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { REGISTRY_ADDRESSES } from '@aegisaudit/sdk';

export function registerAegisInfo(server: McpServer): void {
  server.tool(
    'aegis-info',
    "Get an overview of the AEGIS Protocol and this MCP server's capabilities. Returns protocol description, network configuration, and a list of all available tools.",
    {},
    async () => {
      const chainId = Number(process.env.AEGIS_CHAIN_ID ?? '84532');
      const registryAddress =
        process.env.AEGIS_REGISTRY ?? REGISTRY_ADDRESSES[chainId] ?? 'unknown';
      const networkName =
        chainId === 8453
          ? 'Base Mainnet'
          : chainId === 84532
            ? 'Base Sepolia'
            : `Chain ${chainId}`;

      const info = {
        protocol: 'AEGIS Protocol',
        description:
          'Anonymous Expertise & Guarantee for Intelligent Skills — an on-chain ZK attestation registry for AI agent skills on Base L2.',
        network: {
          name: networkName,
          chainId,
          registryAddress,
        },
        tools: [
          { name: 'aegis-info', description: 'Protocol overview and tool discovery' },
          { name: 'list-all-skills', description: 'Browse all registered skills on-chain', params: 'fromBlock?, toBlock?' },
          { name: 'list-all-auditors', description: 'Browse all registered auditors', params: 'fromBlock?, toBlock?' },
          { name: 'get-attestations', description: 'Get ZK attestations for a specific skill', params: 'skillHash' },
          { name: 'verify-attestation', description: "Verify an attestation's ZK proof on-chain", params: 'skillHash, attestationIndex' },
          { name: 'get-auditor-reputation', description: 'Query auditor reputation data', params: 'auditorCommitment' },
          { name: 'get-metadata-uri', description: 'Get the IPFS metadata URI for a skill', params: 'skillHash' },
          { name: 'list-disputes', description: 'List opened disputes, optionally filtered by skill', params: 'skillHash?, fromBlock?, toBlock?' },
          { name: 'list-resolved-disputes', description: 'List resolved disputes', params: 'fromBlock?, toBlock?' },
        ],
        note: 'This is a read-only MCP server. Write operations (registering skills, staking, disputes) require a wallet and are available via the @aegisaudit/sdk npm package.',
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }],
      };
    },
  );
}
