import type { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js';

export function buildCapabilities(): ServerCapabilities {
  return {
    // Single static tool; list never changes at runtime.
    tools: {},
  };
}
