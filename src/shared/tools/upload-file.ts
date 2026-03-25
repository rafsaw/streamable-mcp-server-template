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
  name: z
    .string()
    .min(1)
    .max(255)
    .describe('File name including extension (e.g. report.pdf, image.png).'),
  content_base64: z
    .string()
    .min(1)
    .describe(
      'File bytes as standard base64 (RFC 4648). Optional data:...;base64, prefix is accepted.',
    ),
});

const uploadFileOutputSchema = {
  success: z.boolean().describe('True when the file was uploaded successfully.'),
  key: z.string().describe('UploadThing file key; empty when success is false.'),
  name: z.string().describe('Original file name.'),
  size: z.number().int().min(0).describe('Size in bytes; 0 when success is false.'),
  url: z.string().describe('Shareable file URL; empty when success is false.'),
  media_type: z
    .string()
    .describe('MIME type used for the upload; empty when success is false.'),
  error_code: z
    .string()
    .describe('Machine-readable error code; empty when success is true.'),
  error_message: z
    .string()
    .max(200)
    .describe('Short error message; empty when success is true.'),
};

function truncateMessage(msg: string, max = 200): string {
  const s = msg.replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export const uploadFileTool = defineTool({
  name: 'upload_file',
  title: 'Upload file',
  description:
    'Upload one file to UploadThing using server credentials. Returns a shareable URL and metadata, or a structured error.',
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
    const name = args.name.trim();
    const mediaType = inferMediaTypeFromFileName(name);

    if (!getUtapi()) {
      const structured = {
        success: false,
        key: '',
        name,
        size: 0,
        url: '',
        media_type: '',
        error_code: 'NOT_CONFIGURED',
        error_message: truncateMessage('UPLOADTHING_TOKEN is not set'),
      };
      return {
        content: [{ type: 'text', text: structured.error_message }],
        structuredContent: structured,
        isError: true,
      };
    }

    let bytes: Uint8Array;
    try {
      bytes = decodeBase64ToBytes(args.content_base64);
    } catch {
      const structured = {
        success: false,
        key: '',
        name,
        size: 0,
        url: '',
        media_type: '',
        error_code: 'INVALID_BASE64',
        error_message: truncateMessage('content_base64 is not valid base64'),
      };
      return {
        content: [{ type: 'text', text: structured.error_message }],
        structuredContent: structured,
        isError: true,
      };
    }

    const maxBytes = getMaxUploadBytes();
    if (bytes.length > maxBytes) {
      const structured = {
        success: false,
        key: '',
        name,
        size: 0,
        url: '',
        media_type: '',
        error_code: 'FILE_TOO_LARGE',
        error_message: truncateMessage(
          `Decoded size ${bytes.length} exceeds limit ${maxBytes}`,
        ),
      };
      return {
        content: [{ type: 'text', text: structured.error_message }],
        structuredContent: structured,
        isError: true,
      };
    }

    if (bytes.length === 0) {
      const structured = {
        success: false,
        key: '',
        name,
        size: 0,
        url: '',
        media_type: '',
        error_code: 'EMPTY_FILE',
        error_message: truncateMessage('Decoded file is empty'),
      };
      return {
        content: [{ type: 'text', text: structured.error_message }],
        structuredContent: structured,
        isError: true,
      };
    }

    const outcome = await uploadBytes(name, bytes, mediaType);

    if (!outcome.ok) {
      const structured = {
        success: false,
        key: '',
        name,
        size: 0,
        url: '',
        media_type: '',
        error_code: outcome.error.code.slice(0, 64) || 'UPLOAD_FAILED',
        error_message: truncateMessage(outcome.error.message || 'Upload failed'),
      };
      return {
        content: [{ type: 'text', text: structured.error_message }],
        structuredContent: structured,
        isError: true,
      };
    }

    const { key, url, name: returnedName, size } = outcome.data;
    const structured = {
      success: true,
      key,
      name: returnedName || name,
      size,
      url,
      media_type: mediaType,
      error_code: '',
      error_message: '',
    };

    return {
      content: [{ type: 'text', text: url }],
      structuredContent: structured,
    };
  },
});
