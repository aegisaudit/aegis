use std::hash::pedersen_hash;

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
