# UploadThing MCP Server

Minimal [Model Context Protocol](https://spec.modelcontextprotocol.io/) server (Streamable HTTP) with a single tool: **`upload_file`**, backed by [UploadThing](https://uploadthing.com/) UTApi.

Same codebase runs on **Node.js (Bun)** or **Cloudflare Workers** (see `src/worker.ts` and `wrangler.example.toml`).

## Requirements

- [Bun](https://bun.sh/) (or Node 20+)
- UploadThing **server token** (`UPLOADTHING_TOKEN` from the dashboard)

## Setup

```bash
bun install
cp .env.example .env
# Set UPLOADTHING_TOKEN in .env
```

## Run (Node)

```bash
bun dev
```

- MCP endpoint: `http://localhost:3000/mcp`
- Health: `http://localhost:3000/health`
- If `AUTH_ENABLED=true`, OAuth AS runs on `PORT + 1` (see template `src/http/auth-app.ts`).

## Tool: `upload_file`

**Input**

| Field | Type | Description |
|--------|------|-------------|
| `file_name` | string | Name with extension |
| `file_content` | string | File bytes as standard base64 |

**Output (success)**

```json
{
  "success": true,
  "file_name": "report.pdf",
  "file_url": "https://…",
  "file_key": "…",
  "error": null
}
```

**Output (failure)**

```json
{
  "success": false,
  "file_name": "report.pdf",
  "file_url": null,
  "file_key": null,
  "error": "short message"
}
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `UPLOADTHING_TOKEN` | Yes | UploadThing API token |
| `UPLOADTHING_MAX_FILE_BYTES` | No | Max decoded size (default ~32 MiB) |
| `PORT`, `MCP_*`, `AUTH_*`, … | No | See `.env.example` for MCP and optional OAuth |

Workers: use `wrangler secret put UPLOADTHING_TOKEN` and env bindings from `wrangler.example.toml`.

## Documentation

- **[guide.md](./guide.md)** — integrate this MCP server from a custom app (HTTP client, auth, patterns).
- **[TESTING.md](./TESTING.md)** — run the server and test `upload_file` manually.

## Project layout

- `src/shared/tools/` — `upload_file` + registry
- `src/shared/services/uploadthing.ts` — UTApi wrapper
- `src/core/mcp.ts` — MCP server build (tools only)
- `src/http/` — Hono app, `/mcp`, `/health`
- `src/adapters/http-workers/` — Workers router + MCP dispatcher

## License

MIT
