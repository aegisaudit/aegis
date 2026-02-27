#!/usr/bin/env python3
"""
Seed the AEGIS Registry on Base Sepolia with sample skills.

Flow:
  1. Register a single auditor (deployer wallet) with 0.02 ETH stake
  2. For each skill: generate unique private inputs -> nargo execute -> bb prove
  3. Register each skill on-chain with the real ZK proof

Requirements:
  - WSL with nargo + bb installed
  - foundry (cast) installed
  - .env file with DEPLOYER_PRIVATE_KEY and BASE_SEPOLIA_RPC_URL
"""

import subprocess
import os
import sys
import json
import re
import time

# -- Config ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CIRCUIT_DIR = os.path.join(PROJECT_ROOT, "packages", "circuits")
ENV_FILE = os.path.join(PROJECT_ROOT, ".env")

REGISTRY_ADDRESS = "0x851CfbB116aBdd50Ab899c35680eBd8273dD6Bba"
RPC_URL = "https://sepolia.base.org"
MIN_AUDITOR_STAKE = "0.02ether"
REGISTRATION_FEE = "0.001ether"

# Auditor private key (for Pedersen commitment, NOT the wallet key)
AUDITOR_PRIVATE_KEY_FIELD = "67890"

# -- Skills to seed ----
SKILLS = [
    {
        "name": "Flow Protocol Skill",
        "description": "Flow protocol operations on Base: discover auctions, launch tokens, submit bids, claim/exit bids, deploy liquidity.",
        "category": "DeFi",
        "level": 2,
        "source_seed": 100,
    },
    {
        "name": "SerpAPI Web Search",
        "description": "Real-time web search via SerpAPI, returning structured results from Google and other engines.",
        "category": "Web Search",
        "level": 1,
        "source_seed": 200,
    },
    {
        "name": "Code Interpreter",
        "description": "Execute Python code in a sandboxed environment for calculations, data analysis, and visualizations.",
        "category": "Code Execution",
        "level": 2,
        "source_seed": 300,
    },
    {
        "name": "Filesystem MCP Server",
        "description": "Secure local file operations including read, write, edit, search, and directory management via MCP.",
        "category": "File Management",
        "level": 1,
        "source_seed": 400,
    },
    {
        "name": "GitHub MCP Server",
        "description": "Manage GitHub repositories: commits, pull requests, issues, branches, and code reviews via MCP.",
        "category": "Version Control",
        "level": 2,
        "source_seed": 500,
    },
    {
        "name": "Playwright Browser Automation",
        "description": "Browser automation for navigating pages, filling forms, clicking elements, and scraping content.",
        "category": "Browser Automation",
        "level": 1,
        "source_seed": 600,
    },
    {
        "name": "RAG Document Search",
        "description": "Retrieval-augmented generation over PDFs, DOCX, and CSVs using vector similarity search.",
        "category": "Data Retrieval",
        "level": 2,
        "source_seed": 700,
    },
    {
        "name": "SQL Database Toolkit",
        "description": "Query and interact with SQL databases. Generate SQL from natural language, validate, and execute.",
        "category": "Database Access",
        "level": 3,
        "source_seed": 800,
    },
]


def load_env():
    env = {}
    with open(ENV_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip()
    return env


def run(cmd, check=True, timeout=120):
    print(f"  $ {cmd[:120]}{'...' if len(cmd) > 120 else ''}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    if check and result.returncode != 0:
        print(f"  STDERR: {result.stderr[:300]}")
        raise RuntimeError(f"Command failed (exit {result.returncode})")
    return result


def generate_source_code(seed):
    return [str((seed * 1000 + i * 7 + 42) % (2**32) or 1) for i in range(64)]


def generate_audit_results(seed):
    return [str((seed * 500 + i * 13 + 99) % (2**32) or 1) for i in range(32)]


def wsl_path(win_path):
    drive = win_path[0].lower()
    rest = win_path[2:].replace("\\", "/")
    return f"/mnt/{drive}{rest}"


def wsl_run(cmd, timeout=60):
    """Run a command in WSL with Noir tools on PATH."""
    full = f'wsl bash -lc "export PATH=\\"$HOME/.nargo/bin:$HOME/.bb:$PATH\\"; {cmd}"'
    return run(full, timeout=timeout)


def parse_circuit_output(stdout):
    """Parse hex values from nargo execute Circuit output line."""
    match = re.search(r'Circuit output:\s*\(([^)]+)\)', stdout)
    if not match:
        return []
    return re.findall(r'0x[0-9a-f]+', match.group(1))


def pad_bytes32(hex_str):
    """Pad a hex string to full bytes32 (0x + 64 hex chars)."""
    return "0x" + hex_str[2:].zfill(64)


def write_helper_prover(helper_dir, source_code, audit_results, auditor_key):
    """Write Prover.toml for the hash helper circuit."""
    src_str = "[" + ", ".join(f'"{v}"' for v in source_code) + "]"
    audit_str = "[" + ", ".join(f'"{v}"' for v in audit_results) + "]"
    with open(os.path.join(helper_dir, "Prover.toml"), "w") as f:
        f.write(f'source_code = {src_str}\naudit_results = {audit_str}\nauditor_private_key = "{auditor_key}"\n')


def write_main_prover(source_code, audit_results, auditor_key, skill_hash, criteria_hash, audit_level, auditor_commitment):
    """Write Prover.toml for the main attestation circuit."""
    src_str = "[" + ", ".join(f'"{v}"' for v in source_code) + "]"
    audit_str = "[" + ", ".join(f'"{v}"' for v in audit_results) + "]"
    with open(os.path.join(CIRCUIT_DIR, "Prover.toml"), "w") as f:
        f.write(f'source_code = {src_str}\n')
        f.write(f'audit_results = {audit_str}\n')
        f.write(f'auditor_private_key = "{auditor_key}"\n')
        f.write(f'skill_hash = "{skill_hash}"\n')
        f.write(f'criteria_hash = "{criteria_hash}"\n')
        f.write(f'audit_level = "{audit_level}"\n')
        f.write(f'auditor_commitment = "{auditor_commitment}"\n')


def main():
    env = load_env()
    deployer_key = env.get("DEPLOYER_PRIVATE_KEY", "")
    if not deployer_key:
        print("ERROR: DEPLOYER_PRIVATE_KEY not set in .env")
        sys.exit(1)
    if not deployer_key.startswith("0x"):
        deployer_key = "0x" + deployer_key

    rpc = env.get("BASE_SEPOLIA_RPC_URL", RPC_URL)
    wsl_circuit_dir = wsl_path(CIRCUIT_DIR)

    print("=" * 60)
    print("AEGIS Registry Seeder - Base Sepolia")
    print("=" * 60)
    print(f"Registry: {REGISTRY_ADDRESS}")
    print(f"RPC:      {rpc}")
    print()

    # -- Step 1: Setup helper circuit --
    print("[1/4] Setting up hash helper circuit...")

    helper_dir = os.path.join(SCRIPT_DIR, "_hash_helper")
    os.makedirs(os.path.join(helper_dir, "src"), exist_ok=True)

    with open(os.path.join(helper_dir, "Nargo.toml"), "w") as f:
        f.write('[package]\nname = "hash_helper"\ntype = "bin"\n\n[dependencies]\n')

    with open(os.path.join(helper_dir, "src", "main.nr"), "w") as f:
        f.write("""use std::hash::pedersen_hash;

fn main(
    source_code: [Field; 64],
    audit_results: [Field; 32],
    auditor_private_key: Field,
) -> pub (Field, Field, Field) {
    let skill_hash = pedersen_hash(source_code);
    let criteria_hash = pedersen_hash(audit_results);
    let auditor_commitment = pedersen_hash([auditor_private_key]);
    (skill_hash, criteria_hash, auditor_commitment)
}
""")

    wsl_helper_dir = wsl_path(helper_dir)
    wsl_run(f"cd {wsl_helper_dir} && nargo compile 2>&1")
    print("  Helper circuit compiled.")

    # -- Step 2: Compute auditor commitment & register --
    print()
    print("[2/4] Registering auditor...")

    # Compute auditor commitment with dummy source (we only need the commitment)
    write_helper_prover(helper_dir, generate_source_code(1), generate_audit_results(1), AUDITOR_PRIVATE_KEY_FIELD)
    result = wsl_run(f"cd {wsl_helper_dir} && nargo execute 2>&1")
    hashes = parse_circuit_output(result.stdout)

    if len(hashes) >= 3:
        auditor_commitment = pad_bytes32(hashes[2])
        print(f"  Auditor commitment: {auditor_commitment}")
    else:
        print("  ERROR: Could not compute auditor commitment from helper output:")
        print(f"  stdout: {result.stdout[:300]}")
        sys.exit(1)

    # Check if already registered
    result = run(
        f'cast call {REGISTRY_ADDRESS} "getAuditorReputation(bytes32)" {auditor_commitment} --rpc-url {rpc}',
        check=False,
    )
    all_zeros = result.stdout.strip().replace("0x", "").replace("\n", "").strip("0") == ""

    if not all_zeros:
        print("  Auditor already registered, skipping.")
    else:
        print(f"  Registering auditor with {MIN_AUDITOR_STAKE} stake...")
        run(
            f'cast send {REGISTRY_ADDRESS} "registerAuditor(bytes32)" {auditor_commitment} '
            f'--value {MIN_AUDITOR_STAKE} --private-key {deployer_key} --rpc-url {rpc}',
            timeout=60,
        )
        print("  Auditor registered!")
        time.sleep(3)

    # -- Step 3: Generate proofs and register skills --
    print()
    print(f"[3/4] Generating proofs and registering {len(SKILLS)} skills...")

    registered = []
    for idx, skill in enumerate(SKILLS):
        print(f"\n  --- Skill {idx+1}/{len(SKILLS)}: {skill['name']} ---")

        source_code = generate_source_code(skill["source_seed"])
        audit_results = generate_audit_results(skill["source_seed"])

        # Compute hashes via helper
        write_helper_prover(helper_dir, source_code, audit_results, AUDITOR_PRIVATE_KEY_FIELD)
        result = wsl_run(f"cd {wsl_helper_dir} && nargo execute 2>&1")
        hashes = parse_circuit_output(result.stdout)

        if len(hashes) < 3:
            print(f"  ERROR: Could not compute hashes, skipping")
            print(f"  stdout: {result.stdout[:200]}")
            continue

        skill_hash = pad_bytes32(hashes[0])
        criteria_hash = pad_bytes32(hashes[1])
        # auditor_commitment is the same for all (same key)

        print(f"  skill_hash:    {skill_hash[:18]}...")
        print(f"  criteria_hash: {criteria_hash[:18]}...")

        # Write Prover.toml for main circuit
        write_main_prover(
            source_code, audit_results, AUDITOR_PRIVATE_KEY_FIELD,
            skill_hash, criteria_hash, skill["level"], auditor_commitment,
        )

        # Execute main circuit
        result = wsl_run(f"cd {wsl_circuit_dir} && nargo execute 2>&1")
        if "successfully" not in result.stdout.lower() and "Circuit witness" not in result.stdout:
            print(f"  ERROR: Circuit execution failed")
            print(f"  {result.stdout[:200]}")
            continue
        print(f"  Circuit executed OK")

        # Generate proof
        wsl_run(
            f"cd {wsl_circuit_dir} && rm -rf ./target/proof_out && mkdir -p ./target/proof_out && "
            f"bb prove -b ./target/attestation.json -w ./target/attestation.gz --oracle_hash keccak -o ./target/proof_out 2>&1",
            timeout=120,
        )

        # Read proof as hex
        proof_path = os.path.join(CIRCUIT_DIR, "target", "proof_out", "proof")
        with open(proof_path, "rb") as f:
            proof_hex = "0x" + f.read().hex()
        print(f"  Proof: {(len(proof_hex)-2)//2} bytes")

        # Build public inputs
        audit_level_b32 = "0x" + hex(skill["level"])[2:].zfill(64)

        # Metadata URI
        metadata_uri = json.dumps({
            "name": skill["name"],
            "description": skill["description"],
            "category": skill["category"],
        })

        # Encode calldata using Python eth_abi (avoids shell escaping issues with 9KB proof hex)
        from eth_abi import encode as abi_encode
        from eth_abi import encode as _  # just to ensure import

        proof_bytes = bytes.fromhex(proof_hex[2:])
        skill_hash_bytes = bytes.fromhex(skill_hash[2:])
        criteria_hash_bytes = bytes.fromhex(criteria_hash[2:])
        audit_level_bytes = bytes.fromhex(audit_level_b32[2:])
        commitment_bytes = bytes.fromhex(auditor_commitment[2:])

        public_inputs_list = [
            skill_hash_bytes,
            criteria_hash_bytes,
            audit_level_bytes,
            commitment_bytes,
        ]

        encoded_args = abi_encode(
            ['bytes32', 'string', 'bytes', 'bytes32[]', 'bytes32', 'uint8'],
            [
                skill_hash_bytes,
                metadata_uri,
                proof_bytes,
                public_inputs_list,
                commitment_bytes,
                skill["level"],
            ]
        )

        # Function selector for registerSkill(bytes32,string,bytes,bytes32[],bytes32,uint8)
        from hashlib import sha3_256
        # Use cast to compute selector
        selector_result = run(
            'cast sig "registerSkill(bytes32,string,bytes,bytes32[],bytes32,uint8)"',
            timeout=10,
        )
        selector = selector_result.stdout.strip()

        calldata = "0x" + selector[2:] + encoded_args.hex()  # selector already has 0x

        calldata_file = os.path.join(SCRIPT_DIR, f"_calldata_{idx}.hex")  # placeholder for cleanup

        # Register skill on-chain using raw calldata via subprocess directly
        print(f"  Registering on-chain (calldata: {len(calldata)//2} bytes)...")
        try:
            cast_args = [
                'cast', 'send', REGISTRY_ADDRESS,
                '--data', calldata,
                '--value', REGISTRATION_FEE,
                '--private-key', deployer_key,
                '--rpc-url', rpc,
            ]
            print(f"  $ cast send {REGISTRY_ADDRESS} --data 0x{calldata[:16]}... --value {REGISTRATION_FEE}")
            result = subprocess.run(cast_args, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                raise RuntimeError(f"cast send failed: {result.stderr[:200]}")

            # Extract tx hash from cast send output
            tx_match = re.search(r'transactionHash\s+(0x[0-9a-f]+)', result.stdout)
            tx_hash = tx_match.group(1) if tx_match else "unknown"
            print(f"  Registered! TX: {tx_hash}")

            registered.append({
                "name": skill["name"],
                "skillHash": skill_hash,
                "level": skill["level"],
                "tx": tx_hash,
            })
        except Exception as e:
            print(f"  ERROR registering: {e}")
        finally:
            for tmpf in [calldata_file]:
                if os.path.exists(tmpf):
                    os.remove(tmpf)

        time.sleep(2)

    # -- Step 4: Summary --
    print()
    print("=" * 60)
    print(f"[4/4] Done! Registered {len(registered)}/{len(SKILLS)} skills")
    print("=" * 60)
    print()
    print(f"Auditor commitment: {auditor_commitment}")
    print()
    for s in registered:
        print(f"  {s['name']}")
        print(f"    Hash:  {s['skillHash']}")
        print(f"    Level: {s['level']}")
        print(f"    TX:    {s['tx']}")
        print()

    results_file = os.path.join(SCRIPT_DIR, "seed-results.json")
    with open(results_file, "w") as f:
        json.dump({
            "registry": REGISTRY_ADDRESS,
            "auditorCommitment": auditor_commitment,
            "skills": registered,
        }, f, indent=2)
    print(f"Results saved to: {results_file}")


if __name__ == "__main__":
    main()
