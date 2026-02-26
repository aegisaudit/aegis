import { describe, it, expect } from 'vitest';
import { CHAIN_CONFIG, MIN_AUDITOR_STAKE, REGISTRATION_FEE } from '../src/constants';

describe('constants', () => {
  it('should have Base chain config', () => {
    expect(CHAIN_CONFIG.base.chainId).toBe(8453);
    expect(CHAIN_CONFIG.baseSepolia.chainId).toBe(84532);
  });

  it('should have correct fee values', () => {
    expect(MIN_AUDITOR_STAKE).toBe(BigInt('10000000000000000'));
    expect(REGISTRATION_FEE).toBe(BigInt('1000000000000000'));
  });
});

describe('AegisClient', () => {
  it('should be importable', async () => {
    const { AegisClient } = await import('../src/client');
    expect(AegisClient).toBeDefined();
  });

  it('should throw if no wallet for write operations', async () => {
    const { AegisClient } = await import('../src/client');
    const client = new AegisClient({
      chainId: 84532,
      registryAddress: '0x0000000000000000000000000000000000000001',
    });

    await expect(
      client.registerAuditor('0x0000000000000000000000000000000000000000000000000000000000000001', BigInt(0)),
    ).rejects.toThrow('Wallet client required');
  });
});
