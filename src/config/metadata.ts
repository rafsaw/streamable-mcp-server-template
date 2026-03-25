/**
 * Centralized tool metadata for the MCP server.
 *
 * This file contains all tool definitions with rich, LLM-friendly descriptions.
 * Benefits:
 * - Single source of truth for tool metadata
 * - Easy to maintain and update descriptions
 * - Natural language optimized for LLM understanding
 * - Consistent structure across all tools
 */

export interface ToolMetadata {
  name: string;
  title: string;
  description: string;
}

export const toolsMetadata = {
  upload_file: {
    name: 'upload_file',
    title: 'Upload file',
    description:
      'Upload one file to UploadThing (base64 body + filename). Returns a shareable URL and metadata, or a structured error.',
  },
} as const satisfies Record<string, ToolMetadata>;

/**
 * Type-safe helper to get metadata for a tool.
 * Usage: getToolMetadata('upload_file')
 */
export function getToolMetadata(toolName: keyof typeof toolsMetadata): ToolMetadata {
  return toolsMetadata[toolName];
}

/**
 * Get all registered tool names.
 */
export function getToolNames(): string[] {
  return Object.keys(toolsMetadata);
}

/**
 * Server-level metadata
 */
export const serverMetadata = {
  title: 'UploadThing MCP',
  instructions:
    'Use upload_file to store a single file and obtain a shareable URL. Prefer structured tool output over guessing URLs.',
} as const;
