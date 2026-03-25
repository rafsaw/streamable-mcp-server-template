# Testing the UploadThing MCP server

This document describes how to run the server and exercise the **`upload_file`** tool over **Streamable HTTP** (`POST /mcp`).

## Prerequisites

1. Dependencies installed: `bun install`
2. Environment file: copy `.env.example` to `.env`
3. For **real uploads**, set **`UPLOADTHING_TOKEN`** in `.env` (UploadThing dashboard → API / server token).
4. Default local URL: **`http://localhost:3000`** (override with **`PORT`** in `.env`).

## Start the server

```bash
bun dev
```

Endpoints:

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/mcp` | MCP (JSON-RPC over HTTP) |
| `http://localhost:3000/health` | HTTP health check (not an MCP tool) |

With default `.env`, **`AUTH_ENABLED=false`** — no OAuth required for local MCP calls.

---

## 1. Quick health check

```bash
curl -s http://localhost:3000/health
```

Expect JSON indicating the server is up.

---

## 2. MCP session rules

After **`initialize`**, the server returns a session id in the response header **`Mcp-Session-Id`**. All later **POST** requests to `/mcp` must include:

```http
Mcp-Session-Id: <value-from-initialize-response>
```

Without it, non-initialize POSTs return **400** (`Mcp-Session-Id required`).

The client should then send **`notifications/initialized`** (MCP lifecycle) before relying on normal operation; many clients do this automatically.

---

## 3. Test with Insomnia (or similar HTTP client)

Use **POST** `http://localhost:3000/mcp` for each step. Common headers:

- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`  
  (Streamable HTTP may use SSE; Insomnia may show a stream or mixed body.)

### Step A — `initialize` (no session header yet)

**Body (JSON):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "insomnia",
      "version": "1.0.0"
    }
  }
}
```

**After send:** copy the **`Mcp-Session-Id`** response header (exact name, case-sensitive).

### Step B — `notifications/initialized`

Same URL, add header:

```http
Mcp-Session-Id: <paste-from-step-A>
```

**Body (JSON)** — notification, **no** `id` field:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### Step C — `tools/list` (optional)

Same **`Mcp-Session-Id`** header.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

You should see **`upload_file`** in the result.

### Step D — `tools/call` → `upload_file`

Same **`Mcp-Session-Id`** header.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "upload_file",
    "arguments": {
      "file_name": "hello.txt",
      "file_content": "SGVsbG8="
    }
  }
}
```

`SGVsbG8=` is base64 for the text `Hello`.

**Where to read the outcome:** the JSON-RPC **`result`** object. The tool’s structured payload is typically under **`result.structuredContent`** (and may include **`result.content`** for a short text line).

**Expected shape (success):**

```json
{
  "success": true,
  "file_name": "hello.txt",
  "file_url": "https://…",
  "file_key": "…",
  "error": null
}
```

**Expected shape (failure, e.g. missing token):**

```json
{
  "success": false,
  "file_name": "hello.txt",
  "file_url": null,
  "file_key": null,
  "error": "UPLOADTHING_TOKEN is not set"
}
```

### Insomnia troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| **400** `Mcp-Session-Id required` | Forgot header on Step B/C/D, or wrong step order. |
| **404** `Invalid session` | Server restarted or session expired; repeat Step A and use a new **`Mcp-Session-Id`**. |
| Body looks like **SSE** (`event:` / `data:`) | Normal for Streamable HTTP; inspect **Timeline** / raw response or parse `data:` lines as JSON. |

---

## 4. Test with an MCP client (recommended for day-to-day)

Configure any client that supports **MCP over Streamable HTTP** and point it at:

```text
http://localhost:3000/mcp
```

The client handles **`initialize`**, **`notifications/initialized`**, session headers, and streaming responses for you.

---

## 5. Cloudflare Workers

1. Configure **`wrangler.toml`** (see `wrangler.example.toml`).
2. Set secrets, e.g. `wrangler secret put UPLOADTHING_TOKEN`.
3. Run `bun run dev:worker` or `wrangler dev`.
4. Use the worker’s **`/mcp`** URL the same way as above (session + JSON-RPC).

---

## 6. Verify TypeScript / build (optional)

```bash
bun run typecheck
bun build src/index.ts --outdir dist --target bun
```

These do not call UploadThing; they only check that the project compiles.
