#!/bin/bash
set -e

# Detect if running in WSL or native Linux/macOS
# On Windows, invoke this script via: wsl -d Ubuntu -- bash scripts/build.sh
# Or use the build-wsl.sh wrapper.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CIRCUIT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$(dirname "$CIRCUIT_DIR")/contracts"

export PATH="$HOME/.nargo/bin:$HOME/.bb:$PATH"

cd "$CIRCUIT_DIR"

echo "==> Compiling Noir circuit..."
nargo compile

echo "==> Generating verification key..."
bb write_vk -b ./target/attestation.json -o ./target --oracle_hash keccak

echo "==> Generating Solidity verifier..."
bb write_solidity_verifier -k ./target/vk -o ./target/Verifier.sol

# Copy verifier to contracts package
DEST="$CONTRACTS_DIR/src/generated"
mkdir -p "$DEST"
cp ./target/Verifier.sol "$DEST/UltraHonkVerifier.sol"

echo "==> Done. Verifier copied to $DEST/UltraHonkVerifier.sol"
echo "    nargo: $(nargo --version 2>&1 | head -1)"
echo "    bb:    $(bb --version 2>&1)"
