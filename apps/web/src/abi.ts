export const registryAbi = [
  {
    type: 'function',
    name: 'registerAuditor',
    inputs: [{ name: 'auditorCommitment', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'addStake',
    inputs: [{ name: 'auditorCommitment', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'registerSkill',
    inputs: [
      { name: 'skillHash', type: 'bytes32' },
      { name: 'metadataURI', type: 'string' },
      { name: 'attestationProof', type: 'bytes' },
      { name: 'publicInputs', type: 'bytes32[]' },
      { name: 'auditorCommitment', type: 'bytes32' },
      { name: 'auditLevel', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getAttestations',
    inputs: [{ name: 'skillHash', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'skillHash', type: 'bytes32' },
          { name: 'auditCriteriaHash', type: 'bytes32' },
          { name: 'zkProof', type: 'bytes' },
          { name: 'auditorCommitment', type: 'bytes32' },
          { name: 'stakeAmount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'auditLevel', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAuditorReputation',
    inputs: [{ name: 'auditorCommitment', type: 'bytes32' }],
    outputs: [
      { name: 'score', type: 'uint256' },
      { name: 'totalStake', type: 'uint256' },
      { name: 'attestationCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'verifyAttestation',
    inputs: [
      { name: 'skillHash', type: 'bytes32' },
      { name: 'attestationIndex', type: 'uint256' },
    ],
    outputs: [{ name: 'valid', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'metadataURIs',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SkillRegistered',
    inputs: [
      { name: 'skillHash', type: 'bytes32', indexed: true },
      { name: 'auditLevel', type: 'uint8', indexed: false },
      { name: 'auditorCommitment', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AuditorRegistered',
    inputs: [
      { name: 'auditorCommitment', type: 'bytes32', indexed: true },
      { name: 'stake', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'openDispute',
    inputs: [
      { name: 'skillHash', type: 'bytes32' },
      { name: 'attestationIndex', type: 'uint256' },
      { name: 'evidence', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'resolveDispute',
    inputs: [
      { name: 'disputeId', type: 'uint256' },
      { name: 'auditorFault', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'DisputeOpened',
    inputs: [
      { name: 'disputeId', type: 'uint256', indexed: true },
      { name: 'skillHash', type: 'bytes32', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'DisputeResolved',
    inputs: [
      { name: 'disputeId', type: 'uint256', indexed: true },
      { name: 'auditorSlashed', type: 'bool', indexed: false },
    ],
  },
] as const;
