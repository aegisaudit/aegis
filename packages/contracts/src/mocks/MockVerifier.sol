// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IVerifier} from "../interfaces/IVerifier.sol";

/// @title MockVerifier
/// @notice Always-valid verifier for testing. Replace with auto-generated UltraPlonk verifier in production.
contract MockVerifier is IVerifier {
    bool public shouldVerify = true;

    function verify(bytes calldata, bytes32[] calldata) external override returns (bool) {
        return shouldVerify;
    }

    /// @notice Toggle verification result (for testing failure paths)
    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }
}
