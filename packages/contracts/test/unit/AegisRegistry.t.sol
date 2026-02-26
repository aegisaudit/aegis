// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console2} from "forge-std/Test.sol";
import {AegisRegistry} from "../../src/AegisRegistry.sol";
import {IAegisRegistry} from "../../src/interfaces/IAegisRegistry.sol";
import {MockVerifier} from "../../src/mocks/MockVerifier.sol";
import {AegisErrors} from "../../src/libraries/AegisErrors.sol";

contract AegisRegistryTest is Test {
    AegisRegistry public registry;
    MockVerifier public verifier;

    address public deployer = address(this);
    address public publisher = makeAddr("publisher");
    address public auditor = makeAddr("auditor");
    address public consumer = makeAddr("consumer");
    address public challenger = makeAddr("challenger");

    bytes32 public auditorCommitment = keccak256(abi.encodePacked("auditor_secret"));
    bytes32 public skillHash = keccak256(abi.encodePacked("my_awesome_skill_v1"));
    bytes public fakeProof = hex"deadbeef";

    function setUp() public {
        verifier = new MockVerifier();
        registry = new AegisRegistry(address(verifier));

        // Fund test accounts
        vm.deal(publisher, 10 ether);
        vm.deal(auditor, 10 ether);
        vm.deal(challenger, 10 ether);
    }

    // ──────────────────────────────────────────────
    //  Auditor Registration
    // ──────────────────────────────────────────────

    function test_registerAuditor() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        (uint256 score, uint256 totalStake, uint256 attestationCount) =
            registry.getAuditorReputation(auditorCommitment);

        assertEq(score, 0);
        assertEq(totalStake, 0.01 ether);
        assertEq(attestationCount, 0);
    }

    function test_registerAuditor_revertInsufficientStake() public {
        vm.prank(auditor);
        vm.expectRevert(AegisErrors.InsufficientStake.selector);
        registry.registerAuditor{value: 0.001 ether}(auditorCommitment);
    }

    function test_registerAuditor_revertAlreadyRegistered() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        vm.prank(auditor);
        vm.expectRevert(AegisErrors.AuditorAlreadyRegistered.selector);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);
    }

    function test_addStake() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        vm.prank(auditor);
        registry.addStake{value: 0.05 ether}(auditorCommitment);

        (, uint256 totalStake,) = registry.getAuditorReputation(auditorCommitment);
        assertEq(totalStake, 0.06 ether);
    }

    function test_addStake_revertNotRegistered() public {
        vm.prank(auditor);
        vm.expectRevert(AegisErrors.AuditorNotRegistered.selector);
        registry.addStake{value: 0.05 ether}(auditorCommitment);
    }

    // ──────────────────────────────────────────────
    //  Skill Registration
    // ──────────────────────────────────────────────

    function _registerAuditorAndSkill() internal {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = skillHash;
        publicInputs[1] = keccak256("criteria_v1_basic");
        publicInputs[2] = bytes32(uint256(1));
        publicInputs[3] = auditorCommitment;

        vm.prank(publisher);
        registry.registerSkill{value: 0.001 ether}(
            skillHash, "ipfs://QmSkillMetadata", fakeProof, publicInputs, auditorCommitment, 1
        );
    }

    function test_registerSkill() public {
        _registerAuditorAndSkill();

        IAegisRegistry.Attestation[] memory attestations = registry.getAttestations(skillHash);
        assertEq(attestations.length, 1);
        assertEq(attestations[0].skillHash, skillHash);
        assertEq(attestations[0].auditLevel, 1);
        assertEq(attestations[0].auditorCommitment, auditorCommitment);
    }

    function test_registerSkill_updatesAuditorReputation() public {
        _registerAuditorAndSkill();

        (uint256 score,, uint256 attestationCount) = registry.getAuditorReputation(auditorCommitment);
        assertEq(score, 1);
        assertEq(attestationCount, 1);
    }

    function test_registerSkill_revertInvalidProof() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        // Make verifier reject proofs
        verifier.setShouldVerify(false);

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = skillHash;
        publicInputs[1] = keccak256("criteria_v1_basic");
        publicInputs[2] = bytes32(uint256(1));
        publicInputs[3] = auditorCommitment;

        vm.prank(publisher);
        vm.expectRevert(AegisErrors.InvalidProof.selector);
        registry.registerSkill{value: 0.001 ether}(
            skillHash, "ipfs://QmSkillMetadata", fakeProof, publicInputs, auditorCommitment, 1
        );
    }

    function test_registerSkill_revertInvalidAuditLevel() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        bytes32[] memory publicInputs = new bytes32[](4);

        vm.prank(publisher);
        vm.expectRevert(AegisErrors.InvalidAuditLevel.selector);
        registry.registerSkill{value: 0.001 ether}(
            skillHash, "", fakeProof, publicInputs, auditorCommitment, 0
        );
    }

    function test_registerSkill_revertInsufficientFee() public {
        vm.prank(auditor);
        registry.registerAuditor{value: 0.01 ether}(auditorCommitment);

        bytes32[] memory publicInputs = new bytes32[](4);

        vm.prank(publisher);
        vm.expectRevert(AegisErrors.InsufficientFee.selector);
        registry.registerSkill{value: 0}(skillHash, "", fakeProof, publicInputs, auditorCommitment, 1);
    }

    function test_registerSkill_revertAuditorNotRegistered() public {
        bytes32[] memory publicInputs = new bytes32[](4);
        bytes32 unknownCommitment = keccak256("unknown");

        vm.prank(publisher);
        vm.expectRevert(AegisErrors.AuditorNotRegistered.selector);
        registry.registerSkill{value: 0.001 ether}(
            skillHash, "", fakeProof, publicInputs, unknownCommitment, 1
        );
    }

    // ──────────────────────────────────────────────
    //  Verification
    // ──────────────────────────────────────────────

    function test_verifyAttestation() public {
        _registerAuditorAndSkill();

        bool valid = registry.verifyAttestation(skillHash, 0);
        assertTrue(valid);
    }

    function test_verifyAttestation_revertNotFound() public {
        vm.expectRevert(AegisErrors.AttestationNotFound.selector);
        registry.verifyAttestation(skillHash, 0);
    }

    // ──────────────────────────────────────────────
    //  Disputes
    // ──────────────────────────────────────────────

    function test_openDispute() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        registry.openDispute{value: 0.005 ether}(skillHash, 0, "malicious code found");
    }

    function test_openDispute_revertInsufficientBond() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        vm.expectRevert(AegisErrors.InsufficientDisputeBond.selector);
        registry.openDispute{value: 0.001 ether}(skillHash, 0, "evidence");
    }

    function test_resolveDispute_auditorFault() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        registry.openDispute{value: 0.005 ether}(skillHash, 0, "malicious code found");

        uint256 challengerBalanceBefore = challenger.balance;

        // Owner resolves in favor of challenger
        registry.resolveDispute(0, true);

        // Challenger receives slashed stake + their bond back
        uint256 challengerBalanceAfter = challenger.balance;
        assertGt(challengerBalanceAfter, challengerBalanceBefore);

        // Auditor reputation decreased
        (uint256 score,,) = registry.getAuditorReputation(auditorCommitment);
        assertEq(score, 0);
    }

    function test_resolveDispute_auditorNotAtFault() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        registry.openDispute{value: 0.005 ether}(skillHash, 0, "false accusation");

        // Owner resolves in favor of auditor
        registry.resolveDispute(0, false);

        // Auditor reputation unchanged
        (uint256 score,,) = registry.getAuditorReputation(auditorCommitment);
        assertEq(score, 1);
    }

    function test_resolveDispute_revertAlreadyResolved() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        registry.openDispute{value: 0.005 ether}(skillHash, 0, "evidence");

        registry.resolveDispute(0, false);

        vm.expectRevert(AegisErrors.DisputeAlreadyResolved.selector);
        registry.resolveDispute(0, true);
    }

    function test_resolveDispute_revertUnauthorized() public {
        _registerAuditorAndSkill();

        vm.prank(challenger);
        registry.openDispute{value: 0.005 ether}(skillHash, 0, "evidence");

        vm.prank(challenger);
        vm.expectRevert(AegisErrors.Unauthorized.selector);
        registry.resolveDispute(0, true);
    }

    // ──────────────────────────────────────────────
    //  Metadata
    // ──────────────────────────────────────────────

    function test_metadataURI_stored() public {
        _registerAuditorAndSkill();

        string memory uri = registry.metadataURIs(skillHash);
        assertEq(uri, "ipfs://QmSkillMetadata");
    }
}
