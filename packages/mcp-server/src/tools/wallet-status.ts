import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient, hasWallet, getWalletAddress } from '../lib/client.js';
import { handleToolCall, serializeResult } from '../lib/serialization.js';
import { getWalletSetupGuide } from '../lib/wallet-guide.js';

export function registerWalletStatus(server: McpServer): void {
  server.tool(
    'wallet-status',
    'Check if a wallet is connected and its ETH balance on the current chain. Returns wallet address, balance, chain info, and whether write operations are available. IMPORTANT: If no wallet is connected, this tool returns a complete step-by-step walletSetupGuide — use it to walk the user through connecting their wallet.',
    {},
    () =>
      handleToolCall(async () => {
        const connected = hasWallet();
        const address = getWalletAddress();
        const chainId = Number(process.env.AEGIS_CHAIN_ID ?? '84532');
        const networkName =
          chainId === 8453
            ? 'Base Mainnet'
            : chainId === 84532
              ? 'Base Sepolia'
              : `Chain ${chainId}`;

        if (!connected || !address) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    connected: false,
                    network: { name: networkName, chainId },
                    writeOperationsAvailable: false,
                    action: 'Walk the user through wallet setup using the guide below. They need to add their private key to the MCP server config file and restart this client.',
                    walletSetupGuide: getWalletSetupGuide(chainId),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Fetch balance
        const client = getClient();
        const publicClient = (client as unknown as { publicClient: { getBalance: (args: { address: string }) => Promise<bigint> } }).publicClient;
        let balance = '0';
        let balanceEth = '0';
        try {
          const raw = await publicClient.getBalance({ address });
          balance = raw.toString();
          balanceEth = (Number(raw) / 1e18).toFixed(6);
        } catch {
          // RPC may fail, still return address info
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  connected: true,
                  address,
                  network: { name: networkName, chainId },
                  balance: { wei: balance, eth: balanceEth },
                  writeOperationsAvailable: true,
                  availableWriteTools: [
                    'register-auditor — Register as anonymous auditor (requires 0.01+ ETH)',
                    'add-stake — Add ETH stake to existing auditor registration',
                    'open-dispute — Challenge a fraudulent attestation (requires 0.005+ ETH bond)',
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      }),
  );
}
