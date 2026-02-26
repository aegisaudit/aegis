import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavConnectWallet } from "../components/NavConnectWallet";

// ── Design System ────────────────────────────────────────────
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

const FONT_HEAD = "'Orbitron', sans-serif";
const FONT = "'Space Mono', monospace";

const GREEN = "#4ADE80";
const PURPLE = "#A78BFA";
const AMBER = "#FBBF24";
const RED = "#F87171";
const BLUE = "#60A5FA";

// ── Syntax Highlighting ──────────────────────────────────────
const SYN_KW = "#C084FC";
const SYN_STR = "#4ADE80";
const SYN_COMMENT = "#4B5563";
const SYN_FN = "#60A5FA";
const SYN_TYPE = "#FBBF24";
const SYN_NUM = "#F87171";
const SYN_DEFAULT = "#A1A1AA";

function highlight(code: string): React.ReactElement[] {
  return code.split("\n").map((line, i) => {
    const spans: React.ReactElement[] = [];
    let key = 0;
    const push = (text: string, color: string) => {
      spans.push(<span key={key++} style={{ color }}>{text}</span>);
    };

    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("#") || line.trimStart().startsWith("--")) {
      push(line, SYN_COMMENT);
      return <div key={i} style={{ minHeight: "1.5em" }}>{spans}</div>;
    }
    if (line.trim() === "") return <div key={i} style={{ minHeight: "1.5em" }}>{"\u00A0"}</div>;

    const tokens: { start: number; end: number; color: string }[] = [];
    let m: RegExpExecArray | null;
    const stringRe = /(["'`])(?:(?!\1|\\).|\\.)*\1/g;
    while ((m = stringRe.exec(line)) !== null) tokens.push({ start: m.index, end: m.index + m[0].length, color: SYN_STR });
    const kwRe = /\b(const|let|var|await|async|import|from|export|if|else|return|new|function|true|false|null|undefined|struct|mapping|bytes32|uint256|uint8|address|bool|event|error|modifier|require|assert|emit|pub|fn|use|external|payable|view|returns|memory|storage|calldata|indexed|revert|contract|is|pragma|solidity|library)\b/g;
    while ((m = kwRe.exec(line)) !== null) {
      if (!tokens.some(t => m!.index >= t.start && m!.index < t.end))
        tokens.push({ start: m.index, end: m.index + m[0].length, color: SYN_KW });
    }
    const fnRe = /\b([a-zA-Z_]\w*)\s*\(/g;
    while ((m = fnRe.exec(line)) !== null) {
      const s = m.index, e = m.index + m[1].length;
      if (!tokens.some(t => s >= t.start && s < t.end))
        tokens.push({ start: s, end: e, color: SYN_FN });
    }
    const typeRe = /\b([A-Z][a-zA-Z0-9]+)\b/g;
    while ((m = typeRe.exec(line)) !== null) {
      if (!tokens.some(t => m!.index >= t.start && m!.index < t.end))
        tokens.push({ start: m.index, end: m.index + m[0].length, color: SYN_TYPE });
    }
    const numRe = /\b(\d+(?:\.\d+)?n?)\b/g;
    while ((m = numRe.exec(line)) !== null) {
      if (!tokens.some(t => m!.index >= t.start && m!.index < t.end))
        tokens.push({ start: m.index, end: m.index + m[0].length, color: SYN_NUM });
    }
    tokens.sort((a, b) => a.start - b.start);
    let pos = 0;
    for (const t of tokens) {
      if (t.start > pos) push(line.slice(pos, t.start), SYN_DEFAULT);
      push(line.slice(t.start, t.end), t.color);
      pos = t.end;
    }
    if (pos < line.length) push(line.slice(pos), SYN_DEFAULT);
    return <div key={i} style={{ minHeight: "1.5em" }}>{spans}</div>;
  });
}

// ── CopyButton ───────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} style={{
      background: copied ? "rgba(74,222,128,0.15)" : SURFACE3,
      border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : BORDER}`,
      borderRadius: 5, padding: "4px 10px", fontSize: 11,
      fontFamily: FONT, color: copied ? GREEN : TEXT_DIM,
      cursor: "pointer", transition: "all 0.15s ease",
    }}>{copied ? "✓ Copied" : "Copy"}</button>
  );
}

// ── CodeBlock ────────────────────────────────────────────────
function CodeBlock({ code, filename, lang }: { code: string; filename?: string; lang?: string }) {
  return (
    <div style={{
      background: "#0D0D10", border: `1px solid ${BORDER}`,
      borderRadius: 10, overflow: "hidden", marginTop: 12, marginBottom: 20,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, background: SURFACE,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EAB308" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} />
          </div>
          {filename && (
            <span style={{
              fontFamily: FONT, fontSize: 11, color: TEXT_DIM,
              background: SURFACE2, padding: "2px 8px", borderRadius: 4,
              border: `1px solid ${BORDER}`,
            }}>{filename}</span>
          )}
          {lang && (
            <span style={{
              fontFamily: FONT, fontSize: 9, color: TEXT_MUTED,
              background: SURFACE2, padding: "1px 6px", borderRadius: 3,
              textTransform: "uppercase",
            }}>{lang}</span>
          )}
        </div>
        <CopyButton text={code} />
      </div>
      <div style={{ padding: "16px 20px", fontFamily: FONT, fontSize: 12.5, lineHeight: 1.5, overflowX: "auto" }}>
        {highlight(code)}
      </div>
    </div>
  );
}

// ── InfoTable ────────────────────────────────────────────────
function InfoTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 8,
      overflow: "hidden", marginTop: 12, marginBottom: 20,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`,
        padding: "10px 16px", background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {headers.map((h, i) => <span key={i}>{h}</span>)}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{
          display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`,
          padding: "10px 16px", borderBottom: ri < rows.length - 1 ? `1px solid ${BORDER}` : "none",
          fontFamily: FONT, fontSize: 12,
        }}>
          {row.map((cell, ci) => (
            <span key={ci} style={{
              color: ci === 0 ? SYN_FN : ci === 1 ? SYN_TYPE : TEXT_DIM,
              wordBreak: "break-word",
            }}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────
interface SidenavSection { id: string; label: string; indent?: boolean; }

const SECTIONS: SidenavSection[] = [
  { id: "overview", label: "Protocol Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "arch-contracts", label: "Smart Contracts", indent: true },
  { id: "arch-circuits", label: "ZK Circuits", indent: true },
  { id: "arch-sdk", label: "SDK", indent: true },
  { id: "arch-cli", label: "CLI", indent: true },
  { id: "audit-levels", label: "Audit Levels" },
  { id: "level-1", label: "L1 Basic", indent: true },
  { id: "level-2", label: "L2 Standard", indent: true },
  { id: "level-3", label: "L3 Comprehensive", indent: true },
  { id: "contract-ref", label: "Contract Reference" },
  { id: "contract-functions", label: "Functions", indent: true },
  { id: "contract-events", label: "Events", indent: true },
  { id: "contract-errors", label: "Errors", indent: true },
  { id: "zk-circuit", label: "ZK Circuit" },
  { id: "cli-ref", label: "CLI Reference" },
  { id: "deployment", label: "Deployment" },
];

function SidenavItem({ label, active, indent, onClick }: {
  label: string; active: boolean; indent?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left",
      background: "transparent", border: "none",
      borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent",
      padding: `6px 16px 6px ${indent ? 28 : 16}px`,
      fontFamily: FONT, fontSize: indent ? 12 : 12.5,
      fontWeight: active ? 600 : 400,
      color: active ? ACCENT : TEXT_DIM,
      cursor: "pointer", transition: "all 0.15s ease",
    }}
      onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = TEXT; }}
      onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = TEXT_DIM; }}
    >{label}</button>
  );
}

// ── Callout Box ──────────────────────────────────────────────
function Callout({ color, label, children }: { color: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`, background: `${color}08`,
      padding: "14px 18px", borderRadius: "0 8px 8px 0",
      marginTop: 12, marginBottom: 20,
    }}>
      <div style={{
        fontFamily: FONT, fontSize: 10, fontWeight: 700,
        color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
      }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: TEXT_DIM, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ── NavBar ───────────────────────────────────────────────────
function DocsNavBar({ onBack, onRegistry, onDevelopers, onAuditors, onDocs }: {
  onBack?: () => void; onRegistry?: () => void; onDevelopers?: () => void; onAuditors?: () => void; onDocs?: () => void;
}) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(9,9,11,0.95)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onBack}>
        <div style={{
          width: 28, height: 28, border: `2px solid ${ACCENT}`, borderRadius: 4,
          transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 8, height: 8, background: ACCENT, borderRadius: 1 }} />
        </div>
        <span style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em" }}>
          AEGIS
        </span>
        <span style={{
          fontFamily: FONT, fontSize: 10, color: ACCENT, background: `${ACCENT}18`,
          border: `1px solid ${ACCENT}30`, borderRadius: 4, padding: "2px 8px",
          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>Docs</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "Registry", onClick: onRegistry },
          { label: "Developers", onClick: onDevelopers },
          { label: "Auditors", onClick: onAuditors },
          { label: "Docs", onClick: onDocs },
        ].map(item => (
          <a key={item.label} href="#" style={{
            color: item.label === "Docs" ? TEXT : TEXT_DIM,
            textDecoration: item.label === "Docs" ? "underline" : "none",
            textUnderlineOffset: 6,
            textDecorationColor: item.label === "Docs" ? ACCENT : "transparent",
            fontSize: 13, fontFamily: FONT,
            fontWeight: item.label === "Docs" ? 600 : 400,
            transition: "color 0.2s",
            cursor: item.label === "Docs" ? "default" : "pointer",
          }}
            onClick={e => { e.preventDefault(); if (item.label !== "Docs" && item.onClick) item.onClick(); }}
            onMouseEnter={e => { if (item.label !== "Docs") (e.target as HTMLElement).style.color = TEXT; }}
            onMouseLeave={e => { if (item.label !== "Docs") (e.target as HTMLElement).style.color = TEXT_DIM; }}
          >{item.label}</a>
        ))}
        <NavConnectWallet />
      </div>
    </nav>
  );
}

// ── Main Component ───────────────────────────────────────────
export function Docs({ onBack, onRegistry, onDevelopers, onAuditors, onDocs }: {
  onBack?: () => void; onRegistry?: () => void; onDevelopers?: () => void; onAuditors?: () => void; onDocs?: () => void;
}) {
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const setRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{
      fontFamily: FONT_HEAD, fontSize: 20, fontWeight: 700,
      color: TEXT, marginBottom: 8,
    }}>{children}</h2>
  );

  const SubHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 style={{
      fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 600,
      color: TEXT, marginBottom: 8, marginTop: 28,
    }}>{children}</h3>
  );

  const Para = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      fontFamily: FONT, fontSize: 13, color: TEXT_DIM,
      lineHeight: 1.7, marginBottom: 16, maxWidth: 720,
    }}>{children}</p>
  );

  const InlineCode = ({ children }: { children: React.ReactNode }) => (
    <code style={{
      color: SYN_FN, background: SURFACE2,
      padding: "1px 5px", borderRadius: 3, fontSize: 12,
      fontFamily: FONT,
    }}>{children}</code>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; color: ${TEXT}; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
      `}</style>

      <DocsNavBar onBack={onBack} onRegistry={onRegistry} onDevelopers={onDevelopers} onAuditors={onAuditors} onDocs={onDocs} />

      <div style={{ display: "flex", paddingTop: 64, minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside style={{
          position: "fixed", top: 64, left: 0, bottom: 0,
          width: 240, padding: "24px 0",
          borderRight: `1px solid ${BORDER}`,
          background: BG, overflowY: "auto", zIndex: 50,
        }}>
          <div style={{
            fontFamily: FONT, fontSize: 10, color: TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "0 16px 12px",
          }}>Documentation</div>
          {SECTIONS.map(s => (
            <SidenavItem
              key={s.id} label={s.label} active={activeSection === s.id}
              indent={s.indent} onClick={() => scrollTo(s.id)}
            />
          ))}
        </aside>

        {/* Content */}
        <main style={{ marginLeft: 240, flex: 1, maxWidth: 820, padding: "40px 48px 120px" }}>

          {/* ═══ Protocol Overview ═══ */}
          <section id="overview" ref={setRef("overview")}>
            <div style={{
              fontFamily: FONT, fontSize: 12, color: ACCENT,
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12,
            }}>Protocol Documentation</div>
            <h1 style={{
              fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 800,
              color: TEXT, letterSpacing: "-0.02em", marginBottom: 12,
            }}>AEGIS Protocol</h1>
            <Para>
              <strong style={{ color: TEXT }}>Anonymous Expertise &amp; Guarantee for Intelligent Skills</strong> — AEGIS is an on-chain attestation registry for AI agent skills deployed on Base L2. It enables anonymous auditors to stake ETH behind cryptographic attestations that verify skill safety, without revealing the source code, the auditor's identity, or the audit results.
            </Para>
            <Para>
              The protocol uses zero-knowledge proofs (UltraHonk via Noir) to prove that an auditor has reviewed a skill's source code and that it meets specific safety criteria — all without exposing any private data on-chain. Consumers can verify these attestations in a single on-chain call before loading any skill into their agents.
            </Para>

            <Callout color={ACCENT} label="Key Principle">
              Trust the proof, not the publisher. AEGIS separates identity from expertise — auditors are identified by Pedersen hash commitments, not wallet addresses. Reputation is built through successful attestations, not credentials.
            </Callout>

            <SubHeading>Core Actors</SubHeading>
            <InfoTable
              headers={["Role", "Description", "On-Chain Action"]}
              rows={[
                ["Publisher", "Deploys AI agent skills and submits them for audit", "registerSkill() — submits skill hash + proof + fee"],
                ["Auditor", "Reviews code and generates ZK attestation proofs", "registerAuditor() — stakes ETH behind identity"],
                ["Consumer", "AI agents that load and execute verified skills", "verify() / getAttestations() — read-only queries"],
                ["Challenger", "Disputes fraudulent or negligent attestations", "openDispute() — posts bond + evidence"],
              ]}
            />
          </section>

          {/* ═══ Architecture ═══ */}
          <section id="architecture" ref={setRef("architecture")} style={{ marginTop: 56 }}>
            <SectionHeading>Architecture</SectionHeading>
            <Para>
              AEGIS is structured as a monorepo with five packages. Each layer is independently deployable and versioned.
            </Para>

            <CodeBlock code={`aegis/
├── packages/
│   ├── contracts/     # Solidity — AegisRegistry + UltraHonkVerifier
│   │   ├── src/       # AegisRegistry.sol, IAegisRegistry.sol, AegisErrors.sol
│   │   ├── test/      # 25 Foundry tests (forge test)
│   │   └── script/    # Deploy.s.sol deployment scripts
│   ├── circuits/      # Noir — ZK attestation circuit
│   │   └── src/       # main.nr (40 lines)
│   ├── sdk/           # TypeScript — AegisClient, prover, IPFS
│   │   └── src/       # client.ts, prover.ts, registry.ts, types.ts
│   └── cli/           # Commander.js — 5 commands
│       └── src/       # register-auditor, register-skill, verify, status, deploy
└── apps/
    └── web/           # React + Vite + wagmi + Three.js`} filename="project-structure" lang="tree" />
          </section>

          {/* Smart Contracts */}
          <section id="arch-contracts" ref={setRef("arch-contracts")} style={{ marginTop: 32 }}>
            <SubHeading>Smart Contracts</SubHeading>
            <Para>
              The contract layer consists of two deployed contracts on Base L2:
            </Para>
            <InfoTable
              headers={["Contract", "Language", "Description"]}
              rows={[
                ["AegisRegistry", "Solidity ^0.8.27", "Core registry — stores attestations, manages auditors, handles disputes"],
                ["UltraHonkVerifier", "Solidity (generated)", "Auto-generated verifier from the Noir circuit. Verifies ZK proofs on-chain"],
              ]}
            />
            <Para>
              AegisRegistry stores attestation data in mappings keyed by <InlineCode>bytes32 skillHash</InlineCode>. Each attestation includes the ZK proof, auditor commitment, stake snapshot, audit level, and timestamp. The verifier contract is called during <InlineCode>registerSkill()</InlineCode> to validate proofs before storage, and again during <InlineCode>verifyAttestation()</InlineCode> for re-verification.
            </Para>
          </section>

          {/* ZK Circuits */}
          <section id="arch-circuits" ref={setRef("arch-circuits")} style={{ marginTop: 32 }}>
            <SubHeading>ZK Circuits</SubHeading>
            <Para>
              The attestation circuit is written in Noir (v1.0.0-beta.18) and compiled to an UltraHonk proof system. The circuit takes private inputs (source code, audit results, auditor key) and public inputs (skill hash, criteria hash, audit level, auditor commitment) and proves four statements without revealing any private data.
            </Para>
            <Callout color={PURPLE} label="What the circuit proves">
              1. <InlineCode>hash(source_code) == skill_hash</InlineCode> — code matches the claimed hash<br/>
              2. <InlineCode>hash(audit_results) == criteria_hash</InlineCode> — audit passed criteria<br/>
              3. <InlineCode>hash(auditor_key) == auditor_commitment</InlineCode> — auditor identity is valid<br/>
              4. <InlineCode>audit_level ∈ [1, 3]</InlineCode> — level is in valid range
            </Callout>
          </section>

          {/* SDK */}
          <section id="arch-sdk" ref={setRef("arch-sdk")} style={{ marginTop: 32 }}>
            <SubHeading>SDK</SubHeading>
            <Para>
              The TypeScript SDK (<InlineCode>@aegis/sdk</InlineCode>) provides a high-level client for interacting with the registry. It wraps viem for chain interactions and includes a prover module for generating ZK proofs via the nargo/bb CLI tools.
            </Para>
            <InfoTable
              headers={["Module", "Exports", "Description"]}
              rows={[
                ["client.ts", "AegisClient", "High-level client with verify, getAttestations, registerSkill, etc."],
                ["prover.ts", "generateAttestationViaCLI, loadProofFromFiles", "ZK proof generation via nargo + bb CLI"],
                ["registry.ts", "Low-level wrappers", "Direct viem contract read/write calls"],
                ["types.ts", "Attestation, AegisConfig, etc.", "TypeScript interfaces for all protocol types"],
                ["constants.ts", "CHAIN_CONFIG, fees", "Chain IDs, RPC URLs, fee amounts"],
                ["ipfs.ts", "fetchMetadata, uploadMetadata", "IPFS metadata storage helpers"],
              ]}
            />
          </section>

          {/* CLI */}
          <section id="arch-cli" ref={setRef("arch-cli")} style={{ marginTop: 32 }}>
            <SubHeading>CLI</SubHeading>
            <Para>
              The CLI (<InlineCode>@aegis/cli</InlineCode>) provides 5 commands for interacting with the protocol from the terminal. Built with Commander.js, chalk, and ora.
            </Para>
            <CodeBlock code={`# Install globally
npm install -g @aegis/cli

# Available commands
aegis register-auditor   # Register as an anonymous auditor
aegis register-skill     # Register a skill with ZK proof
aegis verify             # Verify an attestation on-chain
aegis status             # Query auditor/skill status
aegis deploy             # Deploy contracts (wraps forge)`} filename="terminal" lang="bash" />
          </section>

          {/* ═══ Audit Levels ═══ */}
          <section id="audit-levels" ref={setRef("audit-levels")} style={{ marginTop: 56 }}>
            <SectionHeading>Audit Levels</SectionHeading>
            <Para>
              AEGIS supports three tiers of security audits. Each level builds on the previous one with increasingly rigorous verification criteria. The audit level is stored on-chain as part of the attestation and is a public input to the ZK circuit.
            </Para>
          </section>

          <section id="level-1" ref={setRef("level-1")} style={{ marginTop: 24 }}>
            <div style={{
              padding: "20px 24px", background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 12, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontFamily: FONT, fontSize: 10, fontWeight: 700, color: BG,
                  background: TEXT_DIM, padding: "3px 10px", borderRadius: 4,
                }}>LEVEL 1</span>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: TEXT }}>Basic Safety</span>
              </div>
              <Para>Automated static analysis. Checks for known vulnerability patterns, dangerous system calls, and obvious malicious behavior. Minimum stake: 0.01 ETH.</Para>
              <InfoTable
                headers={["Check", "Description"]}
                rows={[
                  ["Dangerous imports", "Flags use of eval(), exec(), subprocess, os.system"],
                  ["Network access", "Identifies outbound HTTP calls, socket connections"],
                  ["File system access", "Detects read/write operations outside sandbox"],
                  ["Code injection", "Scans for dynamic code generation patterns"],
                ]}
              />
            </div>
          </section>

          <section id="level-2" ref={setRef("level-2")} style={{ marginTop: 16 }}>
            <div style={{
              padding: "20px 24px", background: SURFACE, border: `1px solid ${ACCENT2}30`,
              borderRadius: 12, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontFamily: FONT, fontSize: 10, fontWeight: 700, color: BG,
                  background: ACCENT2, padding: "3px 10px", borderRadius: 4,
                }}>LEVEL 2</span>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: TEXT }}>Standard</span>
              </div>
              <Para>All L1 checks plus manual code review, input validation analysis, and data flow tracking. Minimum stake: 0.05 ETH.</Para>
              <InfoTable
                headers={["Check", "Description"]}
                rows={[
                  ["Input validation", "Verifies all inputs are sanitized and bounded"],
                  ["Data flow analysis", "Tracks data from input to output for leakage"],
                  ["Error handling", "Confirms graceful failure without information disclosure"],
                  ["Resource limits", "Validates memory, CPU, and time bounds are enforced"],
                  ["Dependency audit", "Reviews third-party dependencies for known CVEs"],
                ]}
              />
            </div>
          </section>

          <section id="level-3" ref={setRef("level-3")} style={{ marginTop: 16 }}>
            <div style={{
              padding: "20px 24px", background: SURFACE, border: `1px solid ${ACCENT}30`,
              borderRadius: 12, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontFamily: FONT, fontSize: 10, fontWeight: 700, color: BG,
                  background: ACCENT, padding: "3px 10px", borderRadius: 4,
                }}>LEVEL 3</span>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: TEXT }}>Comprehensive</span>
              </div>
              <Para>All L1 + L2 checks plus formal verification, fuzzing, and adversarial testing. Minimum stake: 0.25 ETH. Reserved for Gold and Diamond tier auditors.</Para>
              <InfoTable
                headers={["Check", "Description"]}
                rows={[
                  ["Formal verification", "Mathematical proof of safety properties"],
                  ["Fuzz testing", "Automated random input generation (1000+ iterations)"],
                  ["Adversarial testing", "Simulated prompt injection and manipulation attacks"],
                  ["Sandbox escape", "Attempts to break out of execution environment"],
                  ["Side-channel analysis", "Checks for timing attacks and information leakage"],
                ]}
              />
            </div>
          </section>

          {/* ═══ Contract Reference ═══ */}
          <section id="contract-ref" ref={setRef("contract-ref")} style={{ marginTop: 56 }}>
            <SectionHeading>Contract Reference</SectionHeading>
            <Para>
              The <InlineCode>AegisRegistry</InlineCode> contract is the core on-chain component. It manages skill attestations, auditor registrations, stake management, and dispute resolution.
            </Para>
            <InfoTable
              headers={["Constant", "Value", "Description"]}
              rows={[
                ["REGISTRATION_FEE", "0.001 ETH", "Fee to register a skill attestation"],
                ["MIN_AUDITOR_STAKE", "0.01 ETH", "Minimum ETH to register as an auditor"],
                ["MIN_DISPUTE_BOND", "0.005 ETH", "Minimum bond to open a dispute"],
              ]}
            />
          </section>

          {/* Functions */}
          <section id="contract-functions" ref={setRef("contract-functions")} style={{ marginTop: 32 }}>
            <SubHeading>Functions</SubHeading>
            <InfoTable
              headers={["Function", "Access", "Description"]}
              rows={[
                ["registerSkill(skillHash, metadataURI, proof, inputs, commitment, level)", "payable", "Register a skill with ZK proof. Requires REGISTRATION_FEE"],
                ["registerAuditor(auditorCommitment)", "payable", "Register as auditor. Requires MIN_AUDITOR_STAKE"],
                ["addStake(auditorCommitment)", "payable", "Add more stake to an existing auditor"],
                ["getAttestations(skillHash)", "view", "Get all attestations for a skill hash"],
                ["verifyAttestation(skillHash, index)", "external", "Re-verify stored ZK proof on-chain"],
                ["getAuditorReputation(commitment)", "view", "Returns (score, totalStake, attestationCount)"],
                ["openDispute(skillHash, index, evidence)", "payable", "Open dispute. Requires MIN_DISPUTE_BOND"],
                ["resolveDispute(disputeId, auditorFault)", "onlyOwner", "Resolve dispute. Slashes 50% if fault=true"],
                ["transferOwnership(newOwner)", "onlyOwner", "Transfer admin role (for future DAO migration)"],
              ]}
            />

            <CodeBlock code={`// Attestation struct stored on-chain
struct Attestation {
    bytes32 skillHash;
    bytes32 auditCriteriaHash;
    bytes zkProof;
    bytes32 auditorCommitment;
    uint256 stakeAmount;
    uint256 timestamp;
    uint8 auditLevel;
}

// Dispute struct
struct Dispute {
    bytes32 skillHash;
    uint256 attestationIndex;
    bytes evidence;
    address challenger;
    uint256 bond;
    bool resolved;
    bool auditorFault;
}`} filename="IAegisRegistry.sol" lang="solidity" />
          </section>

          {/* Events */}
          <section id="contract-events" ref={setRef("contract-events")} style={{ marginTop: 32 }}>
            <SubHeading>Events</SubHeading>
            <InfoTable
              headers={["Event", "Parameters", "When Emitted"]}
              rows={[
                ["SkillRegistered", "skillHash (indexed), auditLevel, auditorCommitment", "New skill attestation registered"],
                ["AuditorRegistered", "auditorCommitment (indexed), stake", "New auditor registers with stake"],
                ["StakeAdded", "auditorCommitment (indexed), amount, totalStake", "Auditor adds to their stake"],
                ["DisputeOpened", "disputeId (indexed), skillHash (indexed)", "Dispute opened against attestation"],
                ["DisputeResolved", "disputeId (indexed), auditorSlashed", "Dispute resolved by governance"],
              ]}
            />
          </section>

          {/* Errors */}
          <section id="contract-errors" ref={setRef("contract-errors")} style={{ marginTop: 32 }}>
            <SubHeading>Errors</SubHeading>
            <InfoTable
              headers={["Error", "Condition", "Fix"]}
              rows={[
                ["InvalidProof()", "ZK proof verification failed", "Ensure proof matches public inputs and circuit version"],
                ["InsufficientStake()", "Stake below 0.01 ETH minimum", "Send at least 0.01 ETH when registering"],
                ["AuditorAlreadyRegistered()", "Commitment already taken", "Generate a new Pedersen commitment"],
                ["AuditorNotRegistered()", "Commitment not found", "Register auditor before submitting skills"],
                ["InvalidAuditLevel()", "Level not 1, 2, or 3", "Set auditLevel to 1, 2, or 3"],
                ["InsufficientFee()", "Fee below 0.001 ETH", "Send at least 0.001 ETH with registerSkill"],
                ["InsufficientDisputeBond()", "Bond below 0.005 ETH", "Send at least 0.005 ETH with openDispute"],
                ["AttestationNotFound()", "Index out of bounds", "Check getAttestations() length first"],
                ["DisputeAlreadyResolved()", "Dispute already resolved", "No action needed"],
                ["Unauthorized()", "Caller is not owner", "Only protocol admin can resolve disputes"],
              ]}
            />
          </section>

          {/* ═══ ZK Circuit ═══ */}
          <section id="zk-circuit" ref={setRef("zk-circuit")} style={{ marginTop: 56 }}>
            <SectionHeading>ZK Circuit</SectionHeading>
            <Para>
              The attestation circuit is written in Noir and compiles to an UltraHonk proof. It uses Pedersen hashing for all commitments. The circuit is intentionally compact (40 lines) to minimize proving time while maintaining security guarantees.
            </Para>

            <CodeBlock code={`use std::hash::pedersen_hash;

fn main(
    // Private inputs -- known only to the auditor
    source_code: [Field; 64],
    audit_results: [Field; 32],
    auditor_private_key: Field,
    // Public inputs -- visible on-chain
    skill_hash: pub Field,
    criteria_hash: pub Field,
    audit_level: pub u8,
    auditor_commitment: pub Field,
) {
    // 1. Verify source code hash matches the claimed skill hash
    let computed_skill_hash = pedersen_hash(source_code);
    assert(computed_skill_hash == skill_hash);

    // 2. Verify audit results hash matches the criteria hash
    let computed_criteria_hash = pedersen_hash(audit_results);
    assert(computed_criteria_hash == criteria_hash);

    // 3. Verify auditor identity via Pedersen commitment
    let computed_commitment = pedersen_hash([auditor_private_key]);
    assert(computed_commitment == auditor_commitment);

    // 4. Validate audit level range
    assert(audit_level >= 1);
    assert(audit_level <= 3);
}`} filename="main.nr" lang="noir" />

            <Callout color={BLUE} label="Proving Requirements">
              <strong style={{ color: TEXT }}>nargo</strong> v1.0.0-beta.18 for circuit compilation &middot;{" "}
              <strong style={{ color: TEXT }}>bb</strong> v3.0.0 for UltraHonk proof generation &middot;{" "}
              On Windows, proving runs via WSL (auto-detected by the SDK)
            </Callout>

            <SubHeading>Proof Lifecycle</SubHeading>
            <div style={{ display: "flex", gap: 2, marginTop: 12, marginBottom: 20 }}>
              {[
                { step: "1", label: "Compile", detail: "nargo compile" },
                { step: "2", label: "Witness", detail: "nargo execute" },
                { step: "3", label: "Prove", detail: "bb prove -b ... -w ... -o proof" },
                { step: "4", label: "Verify", detail: "On-chain via UltraHonkVerifier" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: "16px 14px", background: SURFACE,
                  borderRadius: i === 0 ? "10px 0 0 10px" : i === 3 ? "0 10px 10px 0" : 0,
                  borderRight: i < 3 ? `1px solid ${BORDER}` : "none",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 10, fontWeight: 700,
                    color: BG, background: ACCENT, display: "inline-block",
                    padding: "1px 8px", borderRadius: 3, marginBottom: 8,
                  }}>{s.step}</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: TEXT_MUTED }}>
                    {s.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ CLI Reference ═══ */}
          <section id="cli-ref" ref={setRef("cli-ref")} style={{ marginTop: 56 }}>
            <SectionHeading>CLI Reference</SectionHeading>
            <Para>
              The AEGIS CLI (<InlineCode>@aegis/cli</InlineCode>) wraps the SDK into 5 terminal commands. All commands support <InlineCode>--network</InlineCode> (base-sepolia | base), <InlineCode>--rpc</InlineCode>, and <InlineCode>--registry</InlineCode> flags.
            </Para>

            {[
              {
                name: "register-auditor",
                desc: "Register as an anonymous auditor by staking ETH",
                usage: "aegis register-auditor -c <commitment> -s 0.05 --private-key <key>",
                flags: [
                  ["-c, --commitment <hex>", "bytes32", "Auditor commitment hash (required)"],
                  ["-s, --stake <eth>", "string", "Stake amount in ETH (default: 0.01)"],
                  ["--private-key <key>", "hex", "Wallet private key for signing"],
                ],
              },
              {
                name: "register-skill",
                desc: "Register a skill with a ZK attestation proof",
                usage: "aegis register-skill --proof ./proof --public-inputs ./public_inputs --metadata-uri ipfs://Qm... -c <commitment> -l 2",
                flags: [
                  ["--proof <path>", "string", "Path to proof binary file (required)"],
                  ["--public-inputs <path>", "string", "Path to public_inputs binary (required)"],
                  ["--metadata-uri <uri>", "string", "IPFS metadata URI (required)"],
                  ["-c, --commitment <hex>", "bytes32", "Auditor commitment (required)"],
                  ["-l, --level <n>", "1|2|3", "Audit level (default: 1)"],
                  ["--fee <eth>", "string", "Registration fee (default: 0.001)"],
                ],
              },
              {
                name: "verify",
                desc: "Verify a skill attestation on-chain",
                usage: "aegis verify -s <skillHash> -i 0 --info",
                flags: [
                  ["-s, --skill <hash>", "bytes32", "Skill hash to verify (required)"],
                  ["-i, --index <n>", "number", "Attestation index (default: 0)"],
                  ["--info", "boolean", "Show details without re-verifying proof"],
                ],
              },
              {
                name: "status",
                desc: "Query auditor reputation or skill status",
                usage: "aegis status --auditor <commitment>",
                flags: [
                  ["--auditor <commitment>", "bytes32", "Query auditor reputation data"],
                  ["--skill <hash>", "bytes32", "Query skill attestation details"],
                ],
              },
              {
                name: "deploy",
                desc: "Deploy AEGIS contracts (wraps forge script)",
                usage: "aegis deploy -n base-sepolia --private-key <key> --verify",
                flags: [
                  ["--verify", "boolean", "Verify contracts on Basescan after deploy"],
                  ["--contracts-dir <path>", "string", "Path to contracts package (default: ./packages/contracts)"],
                  ["--private-key <key>", "hex", "Deployer private key"],
                ],
              },
            ].map(cmd => (
              <div key={cmd.name} style={{
                border: `1px solid ${BORDER}`, borderRadius: 10,
                overflow: "hidden", marginBottom: 12,
              }}>
                <div style={{
                  padding: "14px 16px", background: SURFACE,
                  borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: SYN_FN }}>
                      aegis {cmd.name}
                    </span>
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: TEXT_DIM }}>{cmd.desc}</div>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 11, color: TEXT_MUTED,
                    background: "#0D0D10", padding: "8px 12px", borderRadius: 6,
                    marginBottom: 12, border: `1px solid ${BORDER}`,
                  }}>
                    $ {cmd.usage}
                  </div>
                  <InfoTable
                    headers={["Flag", "Type", "Description"]}
                    rows={cmd.flags}
                  />
                </div>
              </div>
            ))}
          </section>

          {/* ═══ Deployment ═══ */}
          <section id="deployment" ref={setRef("deployment")} style={{ marginTop: 56 }}>
            <SectionHeading>Deployment</SectionHeading>
            <Para>
              AEGIS contracts are deployed using Foundry's <InlineCode>forge script</InlineCode> via the CLI. The deploy command handles both the UltraHonkVerifier and AegisRegistry contracts.
            </Para>

            <SubHeading>Chain Configuration</SubHeading>
            <InfoTable
              headers={["Network", "Chain ID", "RPC URL", "Explorer"]}
              rows={[
                ["Base Mainnet", "8453", "https://mainnet.base.org", "https://basescan.org"],
                ["Base Sepolia", "84532", "https://sepolia.base.org", "https://sepolia.basescan.org"],
              ]}
            />

            <SubHeading>Deploy Steps</SubHeading>
            <CodeBlock code={`# 1. Build contracts
cd packages/contracts
forge build

# 2. Deploy to Base Sepolia
aegis deploy -n base-sepolia \\
  --private-key 0x... \\
  --verify

# 3. Verify deployment
aegis status --skill 0x0000...0000 -n base-sepolia

# Output:
# ✓ UltraHonkVerifier deployed at 0x...
# ✓ AegisRegistry deployed at 0x...
# ✓ Contracts verified on Basescan`} filename="terminal" lang="bash" />

            <SubHeading>Environment Variables</SubHeading>
            <InfoTable
              headers={["Variable", "Required", "Description"]}
              rows={[
                ["PRIVATE_KEY", "Yes", "Deployer wallet private key (hex)"],
                ["BASESCAN_API_KEY", "For --verify", "Basescan API key for contract verification"],
                ["RPC_URL", "No", "Custom RPC URL (defaults to public Base RPC)"],
              ]}
            />

            <Callout color={AMBER} label="Important">
              Never commit private keys or API keys to version control. Use environment variables or a <InlineCode>.env</InlineCode> file (which is gitignored by default in the monorepo).
            </Callout>
          </section>

          <div style={{ height: 80 }} />
        </main>
      </div>
    </>
  );
}
