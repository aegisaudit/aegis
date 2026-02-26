// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IAegisRegistry} from "./interfaces/IAegisRegistry.sol";
import {IVerifier} from "./interfaces/IVerifier.sol";
import {AegisErrors} from "./libraries/AegisErrors.sol";

/// @title AegisRegistry
/// @notice On-chain registry for ZK-verified AI skill attestations
/// @dev Delegates proof verification to an external UltraPlonk verifier contract
contract AegisRegistry is IAegisRegistry {
    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    struct AuditorInfo {
        uint256 totalStake;
        uint256 reputationScore;
        uint256 attestationCount;
        bool registered;
    }

    /// @notice The ZK proof verifier contract
    IVerifier public immutable verifier;

    /// @notice Protocol admin (for dispute resolution; upgradeable to DAO later)
    address public owner;

    /// @notice Minimum stake required to register as an auditor
    uint256 public constant MIN_AUDITOR_STAKE = 0.01 ether;

    /// @notice Minimum bond required to open a dispute
    uint256 public constant MIN_DISPUTE_BOND = 0.005 ether;

    /// @notice Skill registration fee
    uint256 public constant REGISTRATION_FEE = 0.001 ether;

    /// @notice skillHash → attestations
    mapping(bytes32 => Attestation[]) private _attestations;

    /// @notice auditorCommitment → auditor info
    mapping(bytes32 => AuditorInfo) private _auditors;

    /// @notice disputeId → dispute
    mapping(uint256 => Dispute) private _disputes;

    /// @notice Counter for dispute IDs
    uint256 private _nextDisputeId;

    /// @notice skillHash → metadataURI
    mapping(bytes32 => string) public metadataURIs;

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
        owner = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert AegisErrors.Unauthorized();
        _;
    }

    // ──────────────────────────────────────────────
    //  Publisher Actions
    // ──────────────────────────────────────────────

    /// @inheritdoc IAegisRegistry
    function registerSkill(
        bytes32 skillHash,
        string calldata metadataURI,
        bytes calldata attestationProof,
        bytes32[] calldata publicInputs,
        bytes32 auditorCommitment,
        uint8 auditLevel
    ) external payable {
        if (msg.value < REGISTRATION_FEE) revert AegisErrors.InsufficientFee();
        if (auditLevel < 1 || auditLevel > 3) revert AegisErrors.InvalidAuditLevel();
        if (!_auditors[auditorCommitment].registered) revert AegisErrors.AuditorNotRegistered();

        // Verify the ZK proof on-chain
        bool valid = verifier.verify(attestationProof, publicInputs);
        if (!valid) revert AegisErrors.InvalidProof();

        // Store the attestation
        _attestations[skillHash].push(
            Attestation({
                skillHash: skillHash,
                auditCriteriaHash: publicInputs.length > 1 ? publicInputs[1] : bytes32(0),
                zkProof: attestationProof,
                auditorCommitment: auditorCommitment,
                stakeAmount: _auditors[auditorCommitment].totalStake,
                timestamp: block.timestamp,
                auditLevel: auditLevel
            })
        );

        // Update auditor stats
        _auditors[auditorCommitment].attestationCount++;
        _auditors[auditorCommitment].reputationScore++;

        // Store metadata URI (overwrites if skill already has one)
        if (bytes(metadataURI).length > 0) {
            metadataURIs[skillHash] = metadataURI;
        }

        emit SkillRegistered(skillHash, auditLevel, auditorCommitment);
    }

    // ──────────────────────────────────────────────
    //  Auditor Actions
    // ──────────────────────────────────────────────

    /// @inheritdoc IAegisRegistry
    function registerAuditor(bytes32 auditorCommitment) external payable {
        if (msg.value < MIN_AUDITOR_STAKE) revert AegisErrors.InsufficientStake();
        if (_auditors[auditorCommitment].registered) revert AegisErrors.AuditorAlreadyRegistered();

        _auditors[auditorCommitment] = AuditorInfo({
            totalStake: msg.value,
            reputationScore: 0,
            attestationCount: 0,
            registered: true
        });

        emit AuditorRegistered(auditorCommitment, msg.value);
    }

    /// @inheritdoc IAegisRegistry
    function addStake(bytes32 auditorCommitment) external payable {
        if (!_auditors[auditorCommitment].registered) revert AegisErrors.AuditorNotRegistered();
        if (msg.value == 0) revert AegisErrors.InsufficientStake();

        _auditors[auditorCommitment].totalStake += msg.value;

        emit StakeAdded(auditorCommitment, msg.value, _auditors[auditorCommitment].totalStake);
    }

    // ──────────────────────────────────────────────
    //  Consumer Queries
    // ──────────────────────────────────────────────

    /// @inheritdoc IAegisRegistry
    function getAttestations(bytes32 skillHash) external view returns (Attestation[] memory) {
        return _attestations[skillHash];
    }

    /// @inheritdoc IAegisRegistry
    function verifyAttestation(bytes32 skillHash, uint256 attestationIndex) external returns (bool valid) {
        Attestation[] storage attestations = _attestations[skillHash];
        if (attestationIndex >= attestations.length) revert AegisErrors.AttestationNotFound();

        Attestation storage att = attestations[attestationIndex];

        // Reconstruct public inputs from stored attestation data
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = att.skillHash;
        publicInputs[1] = att.auditCriteriaHash;
        publicInputs[2] = bytes32(uint256(att.auditLevel));
        publicInputs[3] = att.auditorCommitment;

        return verifier.verify(att.zkProof, publicInputs);
    }

    /// @inheritdoc IAegisRegistry
    function getAuditorReputation(bytes32 auditorCommitment)
        external
        view
        returns (uint256 score, uint256 totalStake, uint256 attestationCount)
    {
        AuditorInfo storage info = _auditors[auditorCommitment];
        return (info.reputationScore, info.totalStake, info.attestationCount);
    }

    // ──────────────────────────────────────────────
    //  Dispute Actions
    // ──────────────────────────────────────────────

    /// @inheritdoc IAegisRegistry
    function openDispute(bytes32 skillHash, uint256 attestationIndex, bytes calldata evidence) external payable {
        if (msg.value < MIN_DISPUTE_BOND) revert AegisErrors.InsufficientDisputeBond();
        if (attestationIndex >= _attestations[skillHash].length) revert AegisErrors.AttestationNotFound();

        uint256 disputeId = _nextDisputeId++;

        _disputes[disputeId] = Dispute({
            skillHash: skillHash,
            attestationIndex: attestationIndex,
            evidence: evidence,
            challenger: msg.sender,
            bond: msg.value,
            resolved: false,
            auditorFault: false
        });

        emit DisputeOpened(disputeId, skillHash);
    }

    /// @inheritdoc IAegisRegistry
    function resolveDispute(uint256 disputeId, bool auditorFault) external onlyOwner {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.resolved) revert AegisErrors.DisputeAlreadyResolved();

        dispute.resolved = true;
        dispute.auditorFault = auditorFault;

        if (auditorFault) {
            // Slash the auditor's stake
            Attestation storage att = _attestations[dispute.skillHash][dispute.attestationIndex];
            bytes32 auditorCommitment = att.auditorCommitment;
            AuditorInfo storage auditor = _auditors[auditorCommitment];

            // Decrease reputation
            if (auditor.reputationScore > 0) {
                auditor.reputationScore--;
            }

            // Slash half the stake, send to challenger as reward
            uint256 slashAmount = auditor.totalStake / 2;
            if (slashAmount > 0) {
                auditor.totalStake -= slashAmount;
                (bool sent,) = dispute.challenger.call{value: slashAmount + dispute.bond}("");
                require(sent, "Transfer failed");
            }
        } else {
            // Auditor not at fault — dispute bond is forfeited (stays in contract)
        }

        emit DisputeResolved(disputeId, auditorFault);
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    /// @notice Transfer ownership (for future DAO migration)
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
