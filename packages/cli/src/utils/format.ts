import { formatEther } from 'viem';

/**
 * Format a bigint ETH value for display.
 */
export function fmtEth(value: bigint): string {
  return `${formatEther(value)} ETH`;
}

/**
 * Truncate a hex string for display: 0x1234...abcd
 */
export function truncateHex(hex: string, chars = 6): string {
  if (hex.length <= chars * 2 + 2) return hex;
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`;
}

/**
 * Format a unix timestamp as a readable date string.
 */
export function fmtTimestamp(ts: bigint): string {
  return new Date(Number(ts) * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

/**
 * Format audit level as a human-readable label.
 */
export function fmtAuditLevel(level: number): string {
  switch (level) {
    case 1:
      return 'Level 1 (Basic)';
    case 2:
      return 'Level 2 (Standard)';
    case 3:
      return 'Level 3 (Comprehensive)';
    default:
      return `Level ${level}`;
  }
}
