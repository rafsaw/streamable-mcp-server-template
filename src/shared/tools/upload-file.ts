import { z } from 'zod';
import {
  decodeBase64ToBytes,
  getMaxUploadBytes,
  getUtapi,
  inferMediaTypeFromFileName,
  uploadBytes,
} from '../services/uploadthing.js';
import { defineTool } from './types.js';

export const uploadFileInputSchema = z.object({
  file_name: z
    .string()
    .min(1)
    .max(255)
    .describe('File name including extension (e.g. report.pdf, image.png).'),
  file_content: z
    .string()
    .min(1)
    .describe(
      'File bytes as standard base64 (RFC 4648). Optional data:...;base64, prefix is accepted.',
    ),
});

const uploadFileOutputSchema = {
  success: z.boolean(),
  file_name: z.string(),
  file_url: z.string().nullable(),
  file_key: z.string().nullable(),
  error: z.string().nullable(),
};

function shortError(message: string, max = 200): string {
  const s = message.replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export const uploadFileTool = defineTool({
  name: 'upload_file',
  title: 'Upload file',
  description:
    'Upload one file to UploadThing. Returns file_url and file_key on success, or a short error string.',
  inputSchema: uploadFileInputSchema,
  outputSchema: uploadFileOutputSchema,
  annotations: {
    title: 'Upload file to UploadThing',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async (args) => {
    const file_name = args.file_name.trim();
    const mediaType = inferMediaTypeFromFileName(file_name);

    const fail = (error: string) => {
      const structured = {
        success: false,
        file_name,
        file_url: null,
        file_key: null,
        error: shortError(error),
      };
      return {
        content: [{ type: 'text' as const, text: structured.error }],
        structuredContent: structured as Record<string, unknown>,
        isError: true,
      };
    };

    if (!getUtapi()) {
      return fail('UPLOADTHING_TOKEN is not set');
    }

    let bytes: Uint8Array;
    try {
      bytes = decodeBase64ToBytes(args.file_content);
    } catch {
      return fail('file_content is not valid base64');
    }

    const maxBytes = getMaxUploadBytes();
    if (bytes.length > maxBytes) {
      return fail(`File size ${bytes.length} exceeds limit ${maxBytes}`);
    }

    if (bytes.length === 0) {
      return fail('Decoded file is empty');
    }

    const outcome = await uploadBytes(file_name, bytes, mediaType);
    if (!outcome.ok) {
      return fail(outcome.error.message || 'Upload failed');
    }

    const { key, url, name: returnedName } = outcome.data;
    const structured = {
      success: true,
      file_name: returnedName || file_name,
      file_url: url,
      file_key: key,
      error: null,
    };

    return {
      content: [{ type: 'text', text: url }],
      structuredContent: structured as Record<string, unknown>,
    };
  },
});
