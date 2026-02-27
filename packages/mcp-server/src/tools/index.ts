import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerAegisInfo } from './aegis-info.js';
import { registerGetAttestations } from './get-attestations.js';
import { registerVerifyAttestation } from './verify-attestation.js';
import { registerGetAuditorReputation } from './get-auditor-reputation.js';
import { registerGetMetadataURI } from './get-metadata-uri.js';
import { registerListAllSkills } from './list-all-skills.js';
import { registerListAllAuditors } from './list-all-auditors.js';
import { registerListDisputes } from './list-disputes.js';
import { registerListResolvedDisputes } from './list-resolved-disputes.js';

/**
 * Register all AEGIS MCP tools on the given server instance.
 */
export function registerAllTools(server: McpServer): void {
  registerAegisInfo(server);
  registerListAllSkills(server);
  registerListAllAuditors(server);
  registerGetAttestations(server);
  registerVerifyAttestation(server);
  registerGetAuditorReputation(server);
  registerGetMetadataURI(server);
  registerListDisputes(server);
  registerListResolvedDisputes(server);
}
