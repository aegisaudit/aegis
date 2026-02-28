/**
 * Shared wallet onboarding instructions for agents.
 *
 * When an agent connects to the AEGIS MCP server without a wallet,
 * these instructions tell it exactly how to guide the user through
 * connecting one — including where config files live on each OS.
 */

interface WalletGuide {
  summary: string;
  steps: string[];
  configLocations: {
    claudeDesktop: Record<string, string>;
    cursor: string;
    claudeCode: string;
  };
  exampleConfig: object;
  faucets: {
    baseSepolia: string[];
  };
  importantNotes: string[];
}

export function getWalletSetupGuide(chainId: number): WalletGuide {
  const networkName =
    chainId === 8453
      ? 'Base Mainnet'
      : chainId === 84532
        ? 'Base Sepolia (testnet)'
        : `Chain ${chainId}`;

  const isTestnet = chainId === 84532;

  return {
    summary: `The AEGIS Protocol requires a wallet with ${isTestnet ? 'testnet ' : ''}ETH on ${networkName} to use write operations (register-auditor, add-stake, open-dispute). Read operations work without a wallet. To enable write operations, the user needs to add their private key to the MCP server environment configuration.`,

    steps: [
      'Step 1: The user needs an Ethereum wallet (e.g. MetaMask, Coinbase Wallet, or any wallet that can export a private key).',
      `Step 2: The wallet needs ${isTestnet ? 'testnet ' : ''}ETH on ${networkName} (chain ID ${chainId}).${isTestnet ? ' Free testnet ETH is available from faucets listed below.' : ''}`,
      'Step 3: Export the private key from the wallet. In MetaMask: Account Details → Show Private Key. IMPORTANT: This should be a dedicated key for AEGIS, not the user\'s main wallet.',
      'Step 4: Open the MCP server config file for the AI client being used (see configLocations below).',
      'Step 5: Add "AEGIS_PRIVATE_KEY": "0x<the-private-key>" to the "env" section of the aegis-protocol server entry.',
      'Step 6: Restart the AI client (Claude Desktop, Cursor, etc.) so it picks up the new environment variable.',
      'Step 7: Call the wallet-status tool to verify the wallet is connected and has sufficient ETH balance.',
    ],

    configLocations: {
      claudeDesktop: {
        macOS: '~/Library/Application Support/Claude/claude_desktop_config.json',
        windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
        linux: '~/.config/claude/claude_desktop_config.json',
      },
      cursor: '~/.cursor/mcp.json',
      claudeCode: 'Run: claude mcp add-json aegis-protocol \'{"command":"npx","args":["-y","@aegisaudit/mcp-server"],"env":{"AEGIS_CHAIN_ID":"84532","AEGIS_PRIVATE_KEY":"0x<key>"}}\'',
    },

    exampleConfig: {
      mcpServers: {
        'aegis-protocol': {
          command: 'npx',
          args: ['-y', '@aegisaudit/mcp-server'],
          env: {
            AEGIS_CHAIN_ID: String(chainId),
            AEGIS_PRIVATE_KEY: '0x<your-private-key-here>',
          },
        },
      },
    },

    faucets: {
      baseSepolia: isTestnet
        ? [
            'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet (Coinbase — requires account)',
            'https://faucet.quicknode.com/base/sepolia (QuickNode)',
            'https://www.alchemy.com/faucets/base-sepolia (Alchemy — requires account)',
          ]
        : [],
    },

    importantNotes: [
      'SECURITY: Never share your private key. Use a dedicated wallet for AEGIS, not your main wallet with significant funds.',
      'The private key is stored locally in the MCP config file and is never sent to any server — it is only used to sign transactions locally.',
      'Minimum ETH required: 0.01 ETH for register-auditor, 0.005 ETH for open-dispute. Keep some extra for gas fees.',
      'Read operations (list-all-skills, get-attestations, verify-attestation, etc.) work without a wallet — only write operations need one.',
    ],
  };
}
