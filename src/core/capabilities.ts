import type { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js';

export function buildCapabilities(): ServerCapabilities {
  return {
    tools: {
      listChanged: true,
    },
  };
}
