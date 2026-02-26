// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IAegisRegistry
/// @notice Interface for the AEGIS skill attestation registry
interface IAegisRegistry {
    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────

    struct Attestation {
        bytes32 skillHash;
        bytes32 auditCriteriaHash;
        bytes zkProof;
        bytes32 auditorCommitment;
        uint256 stakeAmount;
        uint256 timestamp;
        uint8 auditLevel;
    }

    struct Dispute {
        bytes32 skillHash;
        uint256 attestationIndex;
        bytes evidence;
        address challenger;
        uint256 bond;
        bool resolved;
        bool auditorFault;
    }

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event SkillRegistered(bytes32 indexed skillHash, uint8 auditLevel, bytes32 auditorCommitment);
    event AuditorRegistered(bytes32 indexed auditorCommitment, uint256 stake);
    event StakeAdded(bytes32 indexed auditorCommitment, uint256 amount, uint256 totalStake);
    event DisputeOpened(uint256 indexed disputeId, bytes32 indexed skillHash);
    event DisputeResolved(uint256 indexed disputeId, bool auditorSlashed);

    // ──────────────────────────────────────────────
    //  Publisher Actions
    // ──────────────────────────────────────────────

    /// @notice Register a skill with a verified attestation
    /// @param skillHash keccak256 of the skill package
    /// @param metadataURI IPFS URI pointing to skill description
    /// @param attestationProof Serialized ZK proof bytes
    /// @param publicInputs Public inputs for the ZK circuit [skillHash, criteriaHash, auditLevel, auditorCommitment]
    /// @param auditorCommitment Identifies the auditor anonymously
    /// @param auditLevel 1=basic, 2=standard, 3=comprehensive
    function registerSkill(
        bytes32 skillHash,
        string calldata metadataURI,
        bytes calldata attestationProof,
        bytes32[] calldata publicInputs,
        bytes32 auditorCommitment,
        uint8 auditLevel
    ) external payable;

    // ──────────────────────────────────────────────
    //  Auditor Actions
    // ──────────────────────────────────────────────

    /// @notice Register as an anonymous auditor by staking ETH
    /// @param auditorCommitment hash(auditor_private_key) — unique auditor identifier
    function registerAuditor(bytes32 auditorCommitment) external payable;

    /// @notice Add more stake to an existing auditor commitment
    /// @param auditorCommitment The auditor's commitment identifier
    function addStake(bytes32 auditorCommitment) external payable;

    // ──────────────────────────────────────────────
    //  Consumer Queries
    // ──────────────────────────────────────────────

    /// @notice Get all attestations for a skill
    /// @param skillHash keccak256 of the skill package
    /// @return Array of attestations
    function getAttestations(bytes32 skillHash) external view returns (Attestation[] memory);

    /// @notice Verify a specific attestation's proof on-chain
    /// @param skillHash keccak256 of the skill package
    /// @param attestationIndex Index into the attestation array
    /// @return valid True if the stored proof verifies
    function verifyAttestation(bytes32 skillHash, uint256 attestationIndex) external returns (bool valid);

    /// @notice Get an auditor's reputation data
    /// @param auditorCommitment The auditor's commitment identifier
    /// @return score Reputation score
    /// @return totalStake Total ETH staked
    /// @return attestationCount Number of attestations submitted
    function getAuditorReputation(bytes32 auditorCommitment)
        external
        view
        returns (uint256 score, uint256 totalStake, uint256 attestationCount);

    // ──────────────────────────────────────────────
    //  Dispute Actions
    // ──────────────────────────────────────────────

    /// @notice Open a dispute against a skill attestation
    /// @param skillHash keccak256 of the skill package
    /// @param attestationIndex Index of the contested attestation
    /// @param evidence Encoded evidence supporting the dispute
    function openDispute(bytes32 skillHash, uint256 attestationIndex, bytes calldata evidence) external payable;

    /// @notice Resolve a dispute (admin/governance only)
    /// @param disputeId The dispute identifier
    /// @param auditorFault True if the auditor is at fault (triggers slashing)
    function resolveDispute(uint256 disputeId, bool auditorFault) external;
}
