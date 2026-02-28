import { useState, useMemo } from "react";
import { NavConnectWallet } from "../components/NavConnectWallet";

const ACCENT = "#FF3366";
const ACCENT2 = "#FF6B9D";
const BG = "#09090B";
const SURFACE = "#131316";
const SURFACE2 = "#1A1A1F";
const SURFACE3 = "#222228";
const BORDER = "#2A2A30";
const BORDER_LIGHT = "#3A3A42";
const TEXT = "#E4E4E7";
const TEXT_DIM = "#71717A";
const TEXT_MUTED = "#52525B";

const FONT_HEAD = "'Orbitron', sans-serif";
const FONT = "'Space Mono', monospace";

// ── Mock Data ──────────────────────────────────────────────
const SKILL_NAMES = [
  "web-scraper-v3", "sql-executor-safe", "email-sender-v2", "api-caller-v4",
  "file-access-v1", "llm-proxy-secure", "pdf-parser-v2", "browser-agent-v1",
  "code-sandbox-v3", "data-pipeline-v2", "auth-handler-v1", "webhook-relay-v3",
  "vector-search-v1", "image-resize-v2", "cron-scheduler-v1", "rate-limiter-v2",
  "log-aggregator-v1", "cache-manager-v3", "queue-worker-v2", "secret-vault-v1",
  "dns-resolver-v2", "tls-proxy-v1", "websocket-bridge-v2", "graphql-guard-v1",
];

const AUDITORS = [
  "0x7a2E...f91C", "0x3e1B...b44D", "0xc92F...d08A", "0x1f8A...a23E",
  "0x9b3C...e67F", "0x5d4D...c12B", "0x8f2E...7a9C", "0x4c1A...3b8D",
];

const STATUS_CYCLE: ("active" | "disputed" | "expired" | "revoked")[] = [
  "active", "active", "active", "active", "active", "disputed", "expired", "revoked",
];

function randomHex(len: number) {
  return [...Array(len)].map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

function randomAddr() {
  return `0x${randomHex(4).toUpperCase()}...${randomHex(4).toUpperCase()}`;
}

interface Attestation {
  id: string;
  skillHash: string;
  name: string;
  publisher: string;
  auditor: string;
  level: 1 | 2 | 3;
  stake: number;
  status: "active" | "disputed" | "expired" | "revoked";
  timestamp: number;
  verifications: number;
}

const MOCK_DATA: Attestation[] = SKILL_NAMES.map((name, i) => {
  const level = ((i % 3) + 1) as 1 | 2 | 3;
  const baseStake = level === 1 ? 0.01 : level === 2 ? 0.05 : 0.25;
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 90);
  return {
    id: `0x${randomHex(8)}`,
    skillHash: randomHex(16),
    name,
    publisher: randomAddr(),
    auditor: AUDITORS[i % AUDITORS.length],
    level,
    stake: parseFloat((baseStake * (1 + Math.random() * 2)).toFixed(4)),
    status: STATUS_CYCLE[i % STATUS_CYCLE.length],
    timestamp: now - daysAgo * 86400000,
    verifications: 50 + Math.floor(Math.random() * 2000),
  };
});

const PER_PAGE = 10;

// ── Reusable Components ────────────────────────────────────

function FilterChip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? ACCENT + "18" : "transparent",
      border: `1px solid ${active ? ACCENT + "40" : BORDER}`,
      color: active ? ACCENT : TEXT_DIM,
      fontFamily: FONT, fontSize: 12, fontWeight: 400,
      padding: "5px 10px", borderRadius: 6, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "all 0.12s ease",
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? ACCENT + "30" : SURFACE3,
          color: active ? ACCENT : TEXT_MUTED,
          fontSize: 10, fontFamily: FONT, fontWeight: 700,
          padding: "1px 6px", borderRadius: 10, minWidth: 18, textAlign: "center",
        }}>{count}</span>
      )}
    </button>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{
      flex: 1, background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 10, padding: "20px 24px",
    }}>
      <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 700, color: accent ? ACCENT : TEXT, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function LevelDots({ level }: { level: 1 | 2 | 3 }) {
  const fillColor = level === 3 ? ACCENT : level === 2 ? ACCENT2 : TEXT_DIM;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: n <= level ? fillColor : SURFACE3,
          border: n <= level ? "none" : `1px solid ${BORDER}`,
        }} />
      ))}
      <span style={{ fontFamily: FONT, fontSize: 11, color: TEXT_DIM, marginLeft: 4 }}>L{level}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    active: { color: "#4ADE80", bg: "#4ADE8015" },
    disputed: { color: "#F87171", bg: "#F8717115" },
    expired: { color: TEXT_MUTED, bg: SURFACE3 },
    revoked: { color: "#FBBF24", bg: "#FBBF2415" },
  };
  const s = map[status] || map.expired;
  return (
    <span style={{
      fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 4,
      textTransform: "uppercase",
    }}>{status}</span>
  );
}

function MiniButton({ label, variant = "neutral", onClick }: { label: string; variant?: "neutral" | "accent" | "danger"; onClick?: () => void }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: SURFACE3, color: TEXT_DIM, border: BORDER },
    accent: { bg: ACCENT + "15", color: ACCENT, border: ACCENT + "30" },
    danger: { bg: "#F8717115", color: "#F87171", border: "#F8717130" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: 11, fontWeight: 400,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "6px 14px", borderRadius: 6, cursor: "pointer",
      transition: "opacity 0.12s",
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >{label}</button>
  );
}

function DetailCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: FONT, fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12, color: accent ? ACCENT : TEXT, wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  label: string; sortKey: string; currentSort: string; currentDir: "asc" | "desc"; onSort: (key: string) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <span
      onClick={() => onSort(sortKey)}
      style={{
        cursor: "pointer", userSelect: "none",
        color: active ? TEXT : TEXT_MUTED,
        fontWeight: active ? 700 : 400,
        transition: "color 0.12s",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget.style.color = TEXT); }}
      onMouseLeave={e => { if (!active) (e.currentTarget.style.color = TEXT_MUTED); }}
    >
      {label}
      {active && <span style={{ color: ACCENT, fontSize: 10 }}>{currentDir === "asc" ? "\u2191" : "\u2193"}</span>}
    </span>
  );
}

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 6,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT, fontSize: 12, fontWeight: active ? 700 : 400,
        background: active ? ACCENT + "20" : "transparent",
        border: active ? `1px solid ${ACCENT}40` : `1px solid transparent`,
        color: active ? ACCENT : disabled ? TEXT_MUTED : TEXT_DIM,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.12s",
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = SURFACE3; }}
      onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.background = "transparent"; }}
    >{label}</button>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 20px", borderTop: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontFamily: FONT, fontSize: 12, color: TEXT_MUTED }}>Page {page} of {totalPages}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <PageBtn label="\u2190" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ width: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", color: TEXT_MUTED, fontFamily: FONT, fontSize: 12 }}>&hellip;</span>
          ) : (
            <PageBtn key={p} label={String(p)} active={p === page} onClick={() => onPage(p as number)} />
          )
        )}
        <PageBtn label="\u2192" disabled={page >= totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
}

// ── Attestation Row ────────────────────────────────────────

const GRID = "minmax(180px, 1.5fr) 120px 80px minmax(140px, 1fr) 100px 80px 100px 40px";

function AttestationRow({ att, expanded, onToggle, index }: { att: Attestation; expanded: boolean; onToggle: () => void; index: number }) {
  const dateStr = new Date(att.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const daysActive = Math.floor((Date.now() - att.timestamp) / 86400000);

  return (
    <div style={{ animation: `fadeInUp 0.4s ease ${index * 0.03}s both` }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid", gridTemplateColumns: GRID,
          padding: "14px 20px", borderBottom: expanded ? "none" : `1px solid ${BORDER}`,
          alignItems: "center", cursor: "pointer",
          background: expanded ? SURFACE2 : "transparent",
          transition: "background 0.12s",
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = SURFACE2; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Skill */}
        <div>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT }}>{att.name}</div>
          <div style={{ fontFamily: FONT, fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>
            {att.skillHash.slice(0, 18)}&hellip;
          </div>
        </div>
        {/* Publisher */}
        <div style={{ fontFamily: FONT, fontSize: 12, color: TEXT_DIM }}>{att.publisher}</div>
        {/* Level */}
        <LevelDots level={att.level} />
        {/* Auditor */}
        <div style={{ fontFamily: FONT, fontSize: 12, color: TEXT_DIM }}>{att.auditor}</div>
        {/* Stake */}
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: TEXT }}>{att.stake} ETH</div>
        {/* Status */}
        <StatusBadge status={att.status} />
        {/* Date */}
        <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED }}>{dateStr}</div>
        {/* Expand */}
        <div style={{
          fontFamily: FONT, fontSize: 14, color: TEXT_MUTED, textAlign: "center",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
        }}>{"\u25BE"}</div>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div style={{
          background: SURFACE2, padding: "0 20px 20px", borderBottom: `1px solid ${BORDER}`,
          animation: "fadeInUp 0.25s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <DetailCell label="Full Skill Hash" value={`0x${att.skillHash}`} />
            <DetailCell label="Attestation ID" value={att.id} />
            <DetailCell label="Verification Count" value={att.verifications.toLocaleString()} />
            <DetailCell label="Days Active" value={`${daysActive} days`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <DetailCell label="Audit Level" value={`Level ${att.level} \u2014 ${att.level === 1 ? "Basic" : att.level === 2 ? "Standard" : "Comprehensive"}`} />
            <DetailCell label="Bonded Stake" value={`${att.stake} ETH`} accent />
            <DetailCell label="Auditor Commitment" value={att.auditor} />
            <DetailCell label="Status" value={att.status.charAt(0).toUpperCase() + att.status.slice(1)} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            <MiniButton label="View on Base" variant="neutral" />
            <MiniButton label="Verify Proof" variant="accent" />
            <MiniButton label="Copy Hash" variant="neutral" />
            {att.status === "active" && <MiniButton label="Submit Dispute" variant="danger" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export function Registry({ onBack, onRegistry, onDevelopers, onAuditors, onDocs }: {
  onBack?: () => void; onRegistry?: () => void; onDevelopers?: () => void; onAuditors?: () => void; onDocs?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleLevel(l: number) {
    setLevelFilter(prev => prev === l ? null : l);
    setPage(1);
  }

  function toggleStatus(s: string) {
    setStatusFilter(prev => prev === s ? null : s);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let data = [...MOCK_DATA];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.skillHash.toLowerCase().includes(q) ||
        a.publisher.toLowerCase().includes(q) ||
        a.auditor.toLowerCase().includes(q)
      );
    }
    if (levelFilter) data = data.filter(a => a.level === levelFilter);
    if (statusFilter) data = data.filter(a => a.status === statusFilter);

    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return data;
  }, [search, levelFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const levelCounts = { 1: 0, 2: 0, 3: 0 };
  const statusCounts: Record<string, number> = { active: 0, disputed: 0, expired: 0, revoked: 0 };
  MOCK_DATA.forEach(a => { levelCounts[a.level]++; statusCounts[a.status]++; });

  const totalStake = MOCK_DATA.reduce((s, a) => s + a.stake, 0);
  const totalVerifications = MOCK_DATA.reduce((s, a) => s + a.verifications, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${BG}; color: ${TEXT}; overflow-x: hidden; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
      `}</style>

      {/* Navbar — always opaque glass */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(9,9,11,0.92)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, border: `2px solid ${ACCENT}`, borderRadius: 4,
            transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }} onClick={onBack}>
            <div style={{ width: 8, height: 8, background: ACCENT, borderRadius: 1 }} />
          </div>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em", cursor: "pointer" }} onClick={onBack}>
            AEGIS
          </span>
          <span style={{
            fontFamily: FONT, fontSize: 11, color: TEXT_DIM,
            background: SURFACE2, padding: "2px 8px", borderRadius: 4,
            marginLeft: 4,
          }}>REGISTRY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Registry", onClick: onRegistry },
            { label: "Developers", onClick: onDevelopers },
            { label: "Auditors", onClick: onAuditors },
            { label: "Docs", onClick: onDocs },
          ].map(item => (
            <a key={item.label} href="#" style={{
              color: item.label === "Registry" ? TEXT : TEXT_DIM,
              textDecoration: "none", fontSize: 13, fontFamily: FONT,
              fontWeight: item.label === "Registry" ? 700 : 400,
              borderBottom: item.label === "Registry" ? `2px solid ${ACCENT}` : "2px solid transparent",
              paddingBottom: 2, transition: "color 0.15s",
              cursor: item.label === "Registry" ? "default" : "pointer",
            }}
              onClick={e => { e.preventDefault(); if (item.label !== "Registry" && item.onClick) item.onClick(); }}
              onMouseEnter={e => { if (item.label !== "Registry") (e.target as HTMLElement).style.color = TEXT; }}
              onMouseLeave={e => { if (item.label !== "Registry") (e.target as HTMLElement).style.color = TEXT_DIM; }}
            >{item.label}</a>
          ))}
          <NavConnectWallet />
        </div>
      </nav>

      {/* Page Content */}
      <div style={{ paddingTop: 64 }}>
        {/* Header Section */}
        <div style={{ padding: "32px 48px 24px", borderBottom: `1px solid ${BORDER}`, maxWidth: 1200, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: FONT, fontSize: 12, color: TEXT_MUTED, marginBottom: 16 }}>
            AEGIS <span style={{ margin: "0 6px" }}>/</span> Registry
          </div>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", margin: 0 }}>
                Skill Registry
              </h1>
              <p style={{ fontFamily: FONT, fontSize: 14, color: TEXT_DIM, marginTop: 6 }}>
                Browse and verify on-chain skill attestations
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: FONT, fontSize: 12, color: TEXT_MUTED }}>Synced to block #18,294,021</span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            maxWidth: 680, position: "relative", marginBottom: 24,
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: searchFocused ? SURFACE2 : SURFACE,
              border: `1px solid ${searchFocused ? ACCENT + "60" : BORDER}`,
              borderRadius: 10, padding: "0 16px",
              transition: "all 0.15s ease",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? ACCENT : TEXT_MUTED} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by skill name, hash, publisher, or auditor..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: FONT, fontSize: 14, color: TEXT, padding: "14px 12px",
                }}
              />
              <span style={{
                fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
                background: SURFACE3, border: `1px solid ${BORDER}`,
                padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap",
              }}>{"\u2318"}K</span>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <StatCard label="Total Attestations" value={String(MOCK_DATA.length)} sub={`${statusCounts.active} active`} />
            <StatCard label="Total Staked" value={`${totalStake.toFixed(2)}`} sub="ETH bonded" accent />
            <StatCard label="Verifications" value={totalVerifications.toLocaleString()} sub="all-time queries" />
            <StatCard label="Active Disputes" value={String(statusCounts.disputed)} sub="under review" />
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Level</span>
            <FilterChip label="All" count={MOCK_DATA.length} active={levelFilter === null} onClick={() => { setLevelFilter(null); setPage(1); }} />
            <FilterChip label="L1 Basic" count={levelCounts[1]} active={levelFilter === 1} onClick={() => toggleLevel(1)} />
            <FilterChip label="L2 Standard" count={levelCounts[2]} active={levelFilter === 2} onClick={() => toggleLevel(2)} />
            <FilterChip label="L3 Comprehensive" count={levelCounts[3]} active={levelFilter === 3} onClick={() => toggleLevel(3)} />

            <div style={{ width: 1, height: 20, background: BORDER, margin: "0 8px" }} />

            <span style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Status</span>
            <FilterChip label="All" active={statusFilter === null} onClick={() => { setStatusFilter(null); setPage(1); }} />
            <FilterChip label="Active" active={statusFilter === "active"} onClick={() => toggleStatus("active")} />
            <FilterChip label="Disputed" active={statusFilter === "disputed"} onClick={() => toggleStatus("disputed")} />
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          maxWidth: 1200, margin: "-1px auto 0", background: SURFACE,
          border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "clip",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: GRID,
            padding: "12px 20px", background: SURFACE,
            borderBottom: `1px solid ${BORDER}`,
            fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            <SortHeader label="Skill" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="Publisher" sortKey="publisher" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="Level" sortKey="level" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="Auditor" sortKey="auditor" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="Stake" sortKey="stake" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <span>Status</span>
            <SortHeader label="Date" sortKey="timestamp" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <span />
          </div>

          {/* Rows */}
          {pageData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontFamily: FONT, fontSize: 14, color: TEXT_DIM, marginBottom: 6 }}>No attestations found</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: TEXT_MUTED }}>Try adjusting your search or filters</div>
            </div>
          ) : (
            pageData.map((att, i) => (
              <AttestationRow
                key={att.id}
                att={att}
                index={i}
                expanded={expandedId === att.id}
                onToggle={() => setExpandedId(prev => prev === att.id ? null : att.id)}
              />
            ))
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
          )}
        </div>

        {/* Bottom info bar */}
        <div style={{
          maxWidth: 1200, margin: "12px auto 60px", display: "flex",
          justifyContent: "space-between", padding: "0 4px",
        }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED }}>
            Showing {Math.min((currentPage - 1) * PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length} attestations
          </span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED }}>
            Last indexed: 12 seconds ago &middot; Base L2
          </span>
        </div>
      </div>
    </>
  );
}
