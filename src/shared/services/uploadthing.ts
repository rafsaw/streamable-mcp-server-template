import { UTApi, UTFile } from 'uploadthing/server';

const DEFAULT_MAX_BYTES = 32 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.wasm': 'application/wasm',
};

let utapiInstance: UTApi | null = null;

/**
 * Strip data-URL prefix and whitespace from a base64 payload.
 */
export function normalizeBase64Payload(input: string): string {
  let s = input.trim().replace(/\s/g, '');
  const dataUrl = /^data:[^;]+;base64,(.+)$/i.exec(s);
  if (dataUrl?.[1]) s = dataUrl[1];
  return s;
}

/**
 * Decode standard base64 (RFC 4648) to bytes. Works in Node and Workers.
 */
export function decodeBase64ToBytes(b64: string): Uint8Array {
  const normalized = normalizeBase64Payload(b64);
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(normalized, 'base64'));
  }
  let base64 = normalized.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(pad);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function inferMediaTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  const ext = lower.slice(dot);
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

export function getMaxUploadBytes(): number {
  const raw = process.env.UPLOADTHING_MAX_FILE_BYTES;
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0
    ? Math.min(n, 128 * 1024 * 1024)
    : DEFAULT_MAX_BYTES;
}

export function getUploadThingToken(): string | undefined {
  const t = process.env.UPLOADTHING_TOKEN?.trim();
  return t || undefined;
}

export function getUtapi(): UTApi | null {
  const token = getUploadThingToken();
  if (!token) return null;
  if (!utapiInstance) {
    utapiInstance = new UTApi({
      token,
      logLevel: 'Error',
    });
  }
  return utapiInstance;
}

export type UploadOk = {
  key: string;
  url: string;
  name: string;
  size: number;
};

export type UploadErr = {
  code: string;
  message: string;
};

/**
 * Upload raw bytes as a single file via UploadThing UTApi.
 */
export async function uploadBytes(
  fileName: string,
  bytes: Uint8Array,
  mediaType: string,
): Promise<{ ok: true; data: UploadOk } | { ok: false; error: UploadErr }> {
  const utapi = getUtapi();
  if (!utapi) {
    return {
      ok: false,
      error: { code: 'NOT_CONFIGURED', message: 'UPLOADTHING_TOKEN is not set' },
    };
  }

  const file = new UTFile([bytes], fileName, { type: mediaType });
  const result = await utapi.uploadFiles(file);

  type SdkResult = {
    data: UploadOk | null;
    error: { code: string; message: string } | null;
  };

  const r = result as SdkResult;
  if (r.data && !r.error) {
    return { ok: true, data: r.data };
  }
  if (r.error) {
    return {
      ok: false,
      error: { code: String(r.error.code), message: String(r.error.message) },
    };
  }
  return {
    ok: false,
    error: { code: 'UNKNOWN', message: 'Upload failed with no error details' },
  };
}
