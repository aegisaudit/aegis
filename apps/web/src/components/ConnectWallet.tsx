import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {chain?.name ?? 'Unknown'}{' '}
            {balance ? `| ${Number(formatEther(balance.value)).toFixed(4)} ETH` : ''}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="btn-connect" onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </button>
  );
}
