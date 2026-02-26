import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther, type Hex } from 'viem';
import { registryAbi } from '../abi';
import { useRegistryAddress } from '../hooks/useRegistryAddress';

const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 — Automated',
  2: 'Level 2 — Static + Dynamic',
  3: 'Level 3 — Full Manual',
};

function truncateHex(hex: string): string {
  return hex.length > 16 ? `${hex.slice(0, 10)}...${hex.slice(-6)}` : hex;
}

function formatTimestamp(ts: bigint): string {
  if (ts === 0n) return '—';
  return new Date(Number(ts) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Verify() {
  const registryAddress = useRegistryAddress();
  const [skillHash, setSkillHash] = useState('');
  const [queryHash, setQueryHash] = useState<Hex | undefined>();

  const { data: attestations, isLoading, error } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'getAttestations',
    args: queryHash ? [queryHash] : undefined,
    query: { enabled: !!queryHash && !!registryAddress },
  });

  const { data: metadataURI } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: 'metadataURIs',
    args: queryHash ? [queryHash] : undefined,
    query: { enabled: !!queryHash && !!registryAddress },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!skillHash) return;
    const hex = (skillHash.startsWith('0x') ? skillHash : `0x${skillHash}`) as Hex;
    setQueryHash(hex);
  }

  const attestationList = (attestations ?? []) as readonly {
    skillHash: Hex;
    auditCriteriaHash: Hex;
    zkProof: Hex;
    auditorCommitment: Hex;
    stakeAmount: bigint;
    timestamp: bigint;
    auditLevel: number;
  }[];

  return (
    <div>
      <h2 className="page-title">Verify a Skill</h2>
      <p className="page-desc">
        Look up attestations for any skill by its hash. View audit details and verify ZK proofs on-chain.
      </p>

      <div className="card mb-2">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Skill Hash (bytes32)</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x0eba0c961970330401e4d801bb41e1d85a910c9878d552f5fc7a9d73ee11cb51"
              value={skillHash}
              onChange={(e) => setSkillHash(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!skillHash} style={{ whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="alert alert-info">
          <span className="spinner" /> Fetching attestations...
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          Error: {error.message.length > 120 ? error.message.slice(0, 120) + '...' : error.message}
        </div>
      )}

      {queryHash && !isLoading && !error && attestationList.length === 0 && (
        <div className="alert alert-info">
          No attestations found for this skill hash.
        </div>
      )}

      {attestationList.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-heading)', margin: 0 }}>
              {attestationList.length} Attestation{attestationList.length !== 1 ? 's' : ''}
            </h3>
            {metadataURI && (
              <a
                href={metadataURI as string}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-info"
                style={{ textDecoration: 'none' }}
              >
                Metadata
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {attestationList.map((att, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                    Attestation #{i}
                  </span>
                  <span className={`badge ${att.auditLevel >= 3 ? 'badge-success' : att.auditLevel >= 2 ? 'badge-warning' : 'badge-info'}`}>
                    {LEVEL_LABELS[att.auditLevel] ?? `Level ${att.auditLevel}`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div>
                    <span className="text-muted">Auditor</span>
                    <div className="mono" style={{ color: 'var(--accent)', marginTop: '0.15rem' }}>
                      {truncateHex(att.auditorCommitment)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Criteria Hash</span>
                    <div className="mono" style={{ marginTop: '0.15rem' }}>
                      {truncateHex(att.auditCriteriaHash)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Stake</span>
                    <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                      {formatEther(att.stakeAmount)} ETH
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Timestamp</span>
                    <div style={{ marginTop: '0.15rem' }}>
                      {formatTimestamp(att.timestamp)}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="text-muted">Proof size</span>
                    <div className="mono" style={{ marginTop: '0.15rem' }}>
                      {(att.zkProof.length - 2) / 2} bytes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
