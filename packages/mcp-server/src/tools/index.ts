import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Read tools
import { registerAegisInfo } from './aegis-info.js';
import { registerWalletStatus } from './wallet-status.js';
import { registerGetAttestations } from './get-attestations.js';
import { registerVerifyAttestation } from './verify-attestation.js';
import { registerGetAuditorReputation } from './get-auditor-reputation.js';
import { registerGetMetadataURI } from './get-metadata-uri.js';
import { registerListAllSkills } from './list-all-skills.js';
import { registerListAllAuditors } from './list-all-auditors.js';
import { registerListDisputes } from './list-disputes.js';
import { registerListResolvedDisputes } from './list-resolved-disputes.js';

// Write tools
import { registerRegisterAuditor } from './register-auditor.js';
import { registerAddStake } from './add-stake.js';
import { registerOpenDispute } from './open-dispute.js';

/**
 * Register all AEGIS MCP tools on the given server instance.
 */
export function registerAllTools(server: McpServer): void {
  // Discovery & info
  registerAegisInfo(server);
  registerWalletStatus(server);

  // Read operations
  registerListAllSkills(server);
  registerListAllAuditors(server);
  registerGetAttestations(server);
  registerVerifyAttestation(server);
  registerGetAuditorReputation(server);
  registerGetMetadataURI(server);
  registerListDisputes(server);
  registerListResolvedDisputes(server);

  // Write operations (require AEGIS_PRIVATE_KEY)
  registerRegisterAuditor(server);
  registerAddStake(server);
  registerOpenDispute(server);
}
