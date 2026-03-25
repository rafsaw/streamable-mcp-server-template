

````md
# MCP Server – Spec-Driven Build Playbook (AI Devs s01e03)

## 🎯 Cel
Budowa serwera MCP w podejściu **spec-driven**, gdzie:
- najpierw definiujemy API i kontrakt
- potem projektujemy narzędzia
- na końcu implementujemy

---

# 🧠 High-Level Workflow

1. Przygotowanie API.md (spec)
2. Generowanie listy MCP tools
3. Redukcja i wybór finalnych tools
4. Projekt input/output schema
5. Implementacja MCP server
6. Cleanup template

---

# 1️⃣ Przygotowanie API.md

## Cel
Stworzyć uproszczony opis API jako input dla LLM.

## Zasady
- NIE kopiuj całej dokumentacji
- tylko capability + flow
- bez designu tooli

## Struktura

```md
# API Name

## Overview
What API does

## Relevant Capabilities
- capability 1
- capability 2

## Typical Flow
1. step
2. step

## Authentication
Short description

## Returned Data
- field 1
- field 2
````

---

# 2️⃣ Generowanie listy MCP tools

## Tryb

➡️ Cursor: **AGENT**

## Prompt

```text
Read the following files carefully:
- README.md
- manual.md
- API.md

Then suggest a list of MCP tools that can be built based on the available API.

Follow these rules:
- focus on practical tools for an AI agent
- avoid frontend/UI tools
- group related operations where appropriate
- do not over-split tools unnecessarily

For each tool provide:
- tool name
- purpose
- why it is useful
```

---

# 3️⃣ Redukcja tools (najważniejszy krok)

## Cel

Zastosować zasady z s01e03:

* mniej tools > więcej tools
* grouping
* MVP focus

## Prompt

```text
Review the proposed MCP tools and reduce them using good MCP design practices.

Apply these rules:
- keep the number of tools small
- group closely related operations
- remove tools that are unnecessary for the main use case
- prefer tools that are practical for an AI agent

Return:
- final list of tools
- removed tools
- grouped tools
- short reasoning
```

---

# 4️⃣ Projekt input / output schema

## Cel

Zaprojektować kontrakt zoptymalizowany pod LLM

## Zasady z s01e03

* minimalizm
* deterministyczność
* płaska struktura
* structured JSON
* clear success/error

## Prompt

```text
For the final selected MCP tools, design input and output schemas optimized for LLM usage.

Apply the following constraints:

1. Simplicity:
- minimal number of fields
- no unnecessary optional parameters

2. Determinism:
- consistent structure
- predictable outputs

3. LLM usability:
- intuitive field names
- avoid deeply nested objects

4. Output design:
- always include a success flag
- return only actionable data

5. Error handling:
- consistent structure

For each tool return:
- tool name
- description
- input schema
- output schema
- example input/output
- reasoning
```

---

# ✅ Final Decision (Example)

Tool:

```
upload_file
```

Input:

```json
{
  "file_name": "report.pdf",
  "file_content": "<base64>"
}
```

Output:

```json
{
  "success": true,
  "file_name": "report.pdf",
  "file_url": "https://...",
  "file_key": "abc123",
  "error": null
}
```

---

# 5️⃣ Implementacja MCP server

## Tryb

➡️ Cursor: **AGENT**

## Prompt

```text
Read:
- README.md
- manual.md
- API.md

Implement MCP server using the existing template.

Requirements:
- exactly one tool: upload_file
- follow the defined input/output schema
- do not redesign architecture
- do not add extra tools
- keep implementation simple

Tool definition:

Input:
{
  "file_name": "report.pdf",
  "file_content": "<base64>"
}

Output:
{
  "success": true,
  "file_name": "report.pdf",
  "file_url": "https://...",
  "file_key": "abc123",
  "error": null
}

Error:
{
  "success": false,
  "file_name": "report.pdf",
  "file_url": null,
  "file_key": null,
  "error": "short message"
}

Constraints:
- use environment variables
- implement only single file upload
- deterministic JSON output
- follow template conventions

After implementation:
- list changed files
- show .env example
- show how to run
- show example tool call
```

---

# 6️⃣ Cleanup template

## Cel

Usunięcie wszystkiego co zbędne

## Prompt

```text
Review the current MCP server implementation and clean up the project.

Goal:
Remove all unused or unnecessary parts of the template.

Instructions:
- remove unused files and code
- remove unused tools
- keep only:
  - MCP setup
  - tool registration
  - upload_file
  - API integration

Constraints:
- do not break working code
- do not redesign architecture
- prefer deletion over commenting

After cleanup:
1. list removed elements
2. explain why
3. show final structure
4. confirm tool works

Additionally:
- check unused dependencies
```

---

# 🔥 Key Lessons (s01e03)

## 1. Tool ≠ API

Nie mapuj 1:1 endpointów

## 2. Fewer tools > more tools

Minimalizm wygrywa

## 3. LLM-first design

Nie projektujesz dla backendu, tylko dla modelu

## 4. Determinism > flexibility

Stały shape odpowiedzi

## 5. Avoid overengineering

Najczęstszy błąd

---

# 🧠 Mental Model

## Phase 1 — Discovery

API.md → capabilities

## Phase 2 — Design

tools → schema

## Phase 3 — Build

implementation

## Phase 4 — Cleanup

minimal surface

---

# ✅ Final Outcome

Dobry MCP server:

* ma 1–3 tools
* ma prosty schema
* jest deterministiczny
* ma mało kodu
* jest łatwy dla LLM

---

# 🚀 Reuse

Ten playbook możesz użyć dla:

* REST API
* SaaS tools
* internal systems
* Azure services
* dowolnego integration MCP

```

