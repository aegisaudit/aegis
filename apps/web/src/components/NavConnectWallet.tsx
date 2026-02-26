import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';
import { useState } from 'react';

// Design tokens (matches all pages)
const ACCENT = "#FF3366";
const ACCENT2 = "#FF6B9D";
const BG = "#09090B";
const SURFACE = "#131316";
const SURFACE2 = "#1A1A1F";
const SURFACE3 = "#222228";
const BORDER = "#2A2A30";
const TEXT = "#E4E4E7";
const TEXT_DIM = "#71717A";
const TEXT_MUTED = "#52525B";
const GREEN = "#4ADE80";
const FONT = "'Space Mono', monospace";

export function NavConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [menuOpen, setMenuOpen] = useState(false);

  if (isConnected && address) {
    const balStr = balance ? `${Number(formatEther(balance.value)).toFixed(4)} ETH` : '';
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
            fontFamily: FONT, fontSize: 12, color: TEXT,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT + '60')}
          onMouseLeave={e => {
            if (!menuOpen) e.currentTarget.style.borderColor = BORDER;
          }}
        >
          {/* Green dot */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: GREEN,
            boxShadow: `0 0 6px ${GREEN}60`,
          }} />
          {/* Address */}
          <span style={{ fontWeight: 700 }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {/* Balance */}
          {balStr && (
            <span style={{ color: TEXT_DIM, fontSize: 11 }}>
              {balStr}
            </span>
          )}
          {/* Chevron */}
          <span style={{
            fontSize: 10, color: TEXT_MUTED, marginLeft: 2,
            transform: menuOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}>&#9662;</span>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            />
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6,
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '12px 16px', minWidth: 200,
              zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {/* Chain */}
              <div style={{
                fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                Network
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 12, color: TEXT, marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', background: GREEN,
                }} />
                {chain?.name ?? 'Unknown'}
              </div>

              {/* Address */}
              <div style={{
                fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                Address
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 11, color: ACCENT2, marginBottom: 14,
                wordBreak: 'break-all',
              }}>
                {address}
              </div>

              {/* Balance */}
              {balStr && (
                <>
                  <div style={{
                    fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                  }}>
                    Balance
                  </div>
                  <div style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 700,
                    color: TEXT, marginBottom: 14,
                  }}>
                    {balStr}
                  </div>
                </>
              )}

              {/* Disconnect */}
              <button
                onClick={() => { disconnect(); setMenuOpen(false); }}
                style={{
                  width: '100%', padding: '8px 0',
                  fontFamily: FONT, fontSize: 11, fontWeight: 700,
                  color: '#F87171', background: '#F8717112',
                  border: `1px solid #F8717125`, borderRadius: 6,
                  cursor: 'pointer', transition: 'opacity 0.15s',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Not connected — show connect button
  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      style={{
        background: ACCENT, color: BG, border: 'none', borderRadius: 6,
        padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: isPending ? 'wait' : 'pointer',
        fontFamily: FONT, transition: 'opacity 0.15s',
        opacity: isPending ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!isPending) e.currentTarget.style.opacity = '1'; }}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
