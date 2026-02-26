import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { registryAbi } from '../abi';
import { useRegistryAddress } from '../hooks/useRegistryAddress';
import { MIN_AUDITOR_STAKE } from '../config';
import { TxStatus } from '../components/TxStatus';

export function RegisterAuditor() {
  const { isConnected } = useAccount();
  const registryAddress = useRegistryAddress();

  const [commitment, setCommitment] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.01');

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registryAddress) return;

    const commitmentHex = commitment.startsWith('0x') ? commitment : `0x${commitment}`;

    writeContract({
      address: registryAddress,
      abi: registryAbi,
      functionName: 'registerAuditor',
      args: [commitmentHex as `0x${string}`],
      value: parseEther(stakeAmount),
    });
  }

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h3>Connect your wallet</h3>
        <p>You need a connected wallet to register as an auditor.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Register as Auditor</h2>
      <p className="page-desc">
        Stake ETH against a Pedersen commitment to register as an anonymous auditor.
        Your identity stays private — only the commitment is stored on-chain.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Auditor Commitment (bytes32)</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x1a65fb219ffd58992a8c16d3038ef77e..."
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              required
            />
            <p className="form-hint">
              Your Pedersen commitment — a hash that proves your identity without revealing it.
              Generate this from the Noir circuit off-chain.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Stake Amount (ETH)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.01"
              step="0.001"
              min="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              required
            />
            <p className="form-hint">
              Minimum stake: {Number(MIN_AUDITOR_STAKE) / 1e18} ETH. Higher stakes increase your reputation score.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || isConfirming || !commitment}
          >
            {isPending ? 'Confirm in wallet...' : isConfirming ? 'Registering...' : 'Register Auditor'}
          </button>

          {isSuccess && (
            <button type="button" className="btn btn-secondary ml-2" onClick={() => { reset(); setCommitment(''); }} style={{ marginLeft: '0.75rem' }}>
              Register Another
            </button>
          )}
        </form>

        <div className="mt-2">
          <TxStatus
            hash={hash}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
