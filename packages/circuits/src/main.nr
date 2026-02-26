use std::hash::pedersen_hash;

/// AEGIS Level 1 Attestation Circuit
///
/// Proves:
///   1. hash(source_code) == skill_hash       -- code matches the claimed hash
///   2. hash(audit_results) == criteria_hash   -- audit results match criteria
///   3. hash(auditor_key) == auditor_commitment -- auditor identity is valid
///   4. audit_level is in range [1, 3]
///
/// Private inputs: source_code, audit_results, auditor_private_key
/// Public inputs:  skill_hash, criteria_hash, audit_level, auditor_commitment

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
    assert(computed_skill_hash == skill_hash, "Source code hash does not match skill_hash");

    // 2. Verify audit results hash matches the criteria hash
    let computed_criteria_hash = pedersen_hash(audit_results);
    assert(computed_criteria_hash == criteria_hash, "Audit results do not match criteria_hash");

    // 3. Verify auditor identity
    let computed_commitment = pedersen_hash([auditor_private_key]);
    assert(computed_commitment == auditor_commitment, "Auditor commitment mismatch");

    // 4. Validate audit level range
    assert(audit_level >= 1, "Audit level must be >= 1");
    assert(audit_level <= 3, "Audit level must be <= 3");
}
