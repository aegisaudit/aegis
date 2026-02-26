// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title AegisErrors
/// @notice Custom errors for the AEGIS protocol
library AegisErrors {
    /// @notice ZK proof verification failed
    error InvalidProof();

    /// @notice Auditor stake below minimum requirement
    error InsufficientStake();

    /// @notice Auditor commitment already registered
    error AuditorAlreadyRegistered();

    /// @notice Auditor commitment not found in registry
    error AuditorNotRegistered();

    /// @notice Dispute has already been resolved
    error DisputeAlreadyResolved();

    /// @notice Caller is not authorized for this action
    error Unauthorized();

    /// @notice Invalid audit level (must be 1-3)
    error InvalidAuditLevel();

    /// @notice Dispute bond too low
    error InsufficientDisputeBond();

    /// @notice Attestation index out of bounds
    error AttestationNotFound();

    /// @notice Registration fee not met
    error InsufficientFee();
}
