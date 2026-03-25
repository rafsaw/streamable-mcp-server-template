/**
 * Fallback server title/instructions when env vars are unset (Node + Workers dispatcher).
 * Tool name, description, and schemas live on the tool in `shared/tools/upload-file.ts`.
 */
export const serverMetadata = {
  title: 'UploadThing MCP',
  instructions:
    'Use upload_file to store a single file and obtain a shareable URL. Prefer structured tool output over guessing URLs.',
} as const;
