# Guide: Using this MCP server from a custom application

This document explains how a **custom application** (backend service, script, desktop app, or browser client) can talk to the **UploadThing MCP server** over the network.

The server speaks **MCP over [Streamable HTTP](https://spec.modelcontextprotocol.io/)** at:

```text
POST /mcp   (and optionally GET / DELETE for the same transport)
```

It exposes **one tool**: **`upload_file`** (`file_name` + `file_content` as base64 → UploadThing URL/key).

---

## 1. Two roles: host vs client

| Role | What you do |
|------|----------------|
| **Host** | Run this repo (`bun dev`, Workers deploy). Configure **`UPLOADTHING_TOKEN`** and optional **`AUTH_*`**. Your app does not embed UploadThing credentials if it only calls MCP. |
| **Client** | Your application sends **JSON-RPC 2.0** messages to **`https://your-server/mcp`**, manages **session** headers, and parses **`tools/call`** results. |

Most “custom application” guides assume you are the **client** connecting to a **hosted** MCP URL (yours or your team’s).

---

## 2. What your app must implement (MCP client side)

A minimal MCP **Streamable HTTP** client flow:

1. **`POST /mcp`** with **`initialize`** (no `Mcp-Session-Id` yet).
2. Read **`Mcp-Session-Id`** from the **response headers** (also exposed for CORS browsers: see `src/http/middlewares/cors.ts`).
3. **`POST /mcp`** with **`notifications/initialized`** (same header).
4. **`POST /mcp`** with **`tools/call`** for **`upload_file`**, still sending **`Mcp-Session-Id`**.

Headers your app should typically send:

- `Content-Type: application/json`
- `Accept: application/json, text/event-stream` (responses may use SSE)
- `Mcp-Session-Id: <uuid>` after step 1

If the server has **resource-server auth** enabled, add the headers required by your deployment (see [§5](#5-authentication-when-enabled)).

**Detailed step-by-step** (Insomnia-oriented): [TESTING.md](./TESTING.md).

---

## 3. Calling `upload_file` from your code

### 3.1 Arguments

```json
{
  "file_name": "report.pdf",
  "file_content": "<standard-base64>"
}
```

- Encode file bytes as **standard base64** (padding allowed). Optional `data:mime/type;base64,` prefix is accepted by the server’s decoder.
- Respect **`UPLOADTHING_MAX_FILE_BYTES`** on the server (default ~32 MiB decoded).

### 3.2 JSON-RPC envelope

```json
{
  "jsonrpc": "2.0",
  "id": "<any>",
  "method": "tools/call",
  "params": {
    "name": "upload_file",
    "arguments": {
      "file_name": "report.pdf",
      "file_content": "..."
    }
  }
}
```

### 3.3 Reading the result

The MCP response nests the tool output. In practice you will parse:

- **`result.structuredContent`** — preferred for machines:  
  `success`, `file_name`, `file_url`, `file_key`, `error` (see [README](./README.md)).
- **`result.content`** — may include a short **text** part (e.g. URL on success).

If the HTTP response is **SSE**, your client must read the stream and parse JSON from `data:` lines (same as any Streamable HTTP MCP client).

---

## 4. Integration patterns

### Pattern A — Thin HTTP client (any language)

Use **`fetch`**, **axios**, **reqwest**, etc.:

- Implement the **4-step** session flow above.
- Store **`Mcp-Session-Id`** in memory (or per user/session in your app).
- On **404** / lost session, redo **`initialize`** and obtain a new id.

**Pros:** No MCP SDK required. **Cons:** You own streaming/SSE parsing and edge cases.

### Pattern B — Official MCP TypeScript client

If your app is **Node/Bun** (or another runtime supported by the SDK), use **`@modelcontextprotocol/sdk`** with a **Streamable HTTP** client transport aimed at your server URL. That transport should perform **initialize**, **notifications/initialized**, and session handling for you.

**Pros:** Spec-aligned, less boilerplate. **Cons:** Dependency and runtime constraints; still configure the correct transport class for **Streamable HTTP** (not stdio).

### Pattern C — Agent / LLM framework

Frameworks that support **MCP servers** (HTTP) only need:

- Base URL: `https://your-host/mcp`
- Any required **auth** headers from your deployment

They will discover **`upload_file`** via **`tools/list`** and invoke it like any other MCP tool.

### Pattern D — Browser (SPA)

Possible, but note:

- **CORS** is enabled with `Mcp-Session-Id` in **allowed** and **exposed** headers (see `src/http/middlewares/cors.ts`).
- You still must implement **MCP + optional SSE** in the frontend, or proxy **`/mcp`** through **your backend** (recommended) so the browser never holds MCP session logic or secrets.

**Recommended:** backend-for-frontend: your UI talks to your API; your server calls MCP with a single stored session or one session per user.

---

## 5. Authentication (when enabled)

With default **local dev** (`.env.example`), **`AUTH_ENABLED=false`** — no extra headers for `/mcp`.

When auth is on, the template supports strategies such as **OAuth (RS token)**, **API key**, **bearer**, **custom headers** (`src/http/middlewares/auth.ts`, `src/shared/config/env.ts`). Your application must send whatever the server expects, for example:

- `Authorization: Bearer <token>` for OAuth RS or static bearer
- `X-Api-Key: <key>` (or the configured header name) for API key mode

Exact behavior depends on **`AUTH_STRATEGY`** and related env vars — see **`.env.example`** and the main [README](./README.md).

---

## 6. Operational checklist for production

- **HTTPS** in front of `/mcp` (reverse proxy or Workers).
- **Secrets:** `UPLOADTHING_TOKEN` only on the **MCP server**, not in untrusted clients (unless you intentionally run a private client with the same trust boundary).
- **Rate limiting / size limits:** template env includes **`RPS_LIMIT`**, **`CONCURRENCY_LIMIT`**; uploads are capped by **`UPLOADTHING_MAX_FILE_BYTES`**.
- **Health checks:** `GET /health` for load balancers (not part of MCP).

---

## 7. Related docs

| Doc | Use |
|-----|-----|
| [README.md](./README.md) | Run, env vars, tool I/O shapes |
| [TESTING.md](./TESTING.md) | Manual tests, Insomnia, curl |
| [API.md](./API.md) | Short UploadThing context |

---

## 8. Summary

Your **custom application** is an **MCP client**: it maintains a **Streamable HTTP** session to **`/mcp`**, then calls **`tools/call`** with **`upload_file`** and reads **`structuredContent`**. Hosting this repo is separate: that server holds **UploadThing** credentials and performs the actual upload.
