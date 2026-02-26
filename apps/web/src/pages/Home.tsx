import { useAccount } from 'wagmi';

interface HomeProps {
  onNavigate: (tab: 'home' | 'auditor' | 'skill' | 'verify' | 'status') => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { isConnected } = useAccount();

  return (
    <div>
      <h2 className="page-title">Anonymous Skill Attestations for AI Agents</h2>
      <p className="page-desc">
        Verify that AI agent skills and plugins are safe to run — without revealing source code,
        auditor identity, or publisher identity. Powered by ZK proofs on Base.
      </p>

      <div className="card-grid">
        <button className="card" onClick={() => onNavigate('verify')} style={{ cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.4rem' }}>Verify a Skill</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Look up attestations for any skill by its hash and re-verify the ZK proof on-chain.
          </p>
        </button>

        <button className="card" onClick={() => onNavigate('auditor')} style={{ cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.4rem' }}>Register as Auditor</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Stake ETH to become an anonymous auditor. Your identity stays private via Pedersen commitments.
          </p>
          {!isConnected && <p className="badge badge-info mt-1">Connect wallet</p>}
        </button>

        <button className="card" onClick={() => onNavigate('skill')} style={{ cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📦</div>
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.4rem' }}>Submit a Skill</h3>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Register your AI agent skill with a ZK-verified attestation proof.
          </p>
          {!isConnected && <p className="badge badge-info mt-1">Connect wallet</p>}
        </button>
      </div>

      <div className="card mt-3">
        <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.75rem' }}>How it works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div className="badge badge-info mb-1">Step 1</div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Auditors register anonymously by staking ETH against a Pedersen commitment.
            </p>
          </div>
          <div>
            <div className="badge badge-info mb-1">Step 2</div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Auditors review source code off-chain and generate a ZK proof via Noir circuits.
            </p>
          </div>
          <div>
            <div className="badge badge-info mb-1">Step 3</div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              The proof is verified on-chain by the UltraHonk verifier. Anyone can check it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
