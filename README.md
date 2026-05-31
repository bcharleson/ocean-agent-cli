<p align="center">
  <a href="https://www.ocean.io?aff=NvIcVnxrnAca">
    <img src="assets/ocean-logo.png" alt="Ocean.io" width="72" />
  </a>
</p>

<h1 align="center">ocean-agent-cli</h1>

<p align="center">
  <strong>Ocean.io in your terminal — and in your AI assistant.</strong><br />
  Search companies &amp; people, enrich profiles, reveal emails/phones, and build GTM pipelines from the CLI or MCP.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ocean-agent-cli"><img src="https://img.shields.io/npm/v/ocean-agent-cli.svg" alt="npm version" /></a>
  <a href="https://github.com/bcharleson/ocean-agent-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node 18+" />
  <a href="https://www.ocean.io?aff=NvIcVnxrnAca"><img src="https://img.shields.io/badge/powered%20by-Ocean.io-0066FF.svg" alt="Powered by Ocean.io" /></a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#for-ai-agents">AI agents</a> ·
  <a href="#mcp-server">MCP</a> ·
  <a href="https://app.ocean.io/docs">Ocean API docs</a> ·
  <a href="./OCEAN.md">Agent playbook</a>
</p>

---

## What is Ocean.io?

[Ocean.io](https://www.ocean.io?aff=NvIcVnxrnAca) is a B2B GTM intelligence platform. It helps sales and marketing teams find lookalike companies, search 67M+ company profiles and 250M+ people, enrich account data, and reveal contact details — via the web app or API.

Get an API token under **Settings → API tokens** in the [Ocean app](https://app.ocean.io/).

## What is ocean-agent-cli?

`ocean-agent-cli` is an open-source **CLI and MCP server** for the Ocean.io API. It mirrors the architecture of [instantly-cli](https://github.com/bcharleson/instantly-cli): one command definition powers both terminal usage and MCP tools.

| Audience | What you get |
|----------|----------------|
| **Developers** | Scriptable search, enrich, lookup, and reveal workflows with JSON or pretty output |
| **RevOps / GTM** | Terminal access to Ocean without writing HTTP clients |
| **AI agents** | 18 MCP tools (Claude, Cursor, Windsurf, VS Code) — search, enrich, reveal, autocomplete |
| **Automation** | Stdout JSON, exit codes, `--quiet`, and webhook-based async bulk jobs |

**Coverage:** 20 API commands across search (v3), enrich, lookup, reveal, warmup, autocomplete, credits, and data-fields. v2 search remains in the CLI for backwards compatibility but is hidden from help and MCP.

---

## Install

### npm (recommended)

```bash
npm install -g ocean-agent-cli
```

### npx (zero install)

```bash
npx ocean-agent-cli credits balance --pretty
```

### From source

```bash
git clone https://github.com/bcharleson/ocean-agent-cli.git
cd ocean-agent-cli
npm install && npm run build
npm link   # optional: install `ocean` globally
```

Requires **Node.js 18+**.

---

## Authentication

Credentials are checked in this order:

1. **`--api-token` flag** on any command
2. **`OCEAN_API_TOKEN` environment variable**
3. **Stored config** at `~/.ocean/config.json` (from `ocean login`)

```bash
# Interactive — validates token and saves config
ocean login

# Non-interactive
ocean login --api-token your-token-here

# Environment variable (best for CI and agents)
export OCEAN_API_TOKEN=your-token-here

# Remove stored token
ocean logout
```

Config file format:

```json
{ "api_token": "your-token-here" }
```

---

## Quick start

### Human workflow — find and enrich a prospect

```bash
# Check credits before bulk work
ocean credits balance --pretty

# Discover valid filter field names
ocean data-fields list

# Search VP Sales at US companies in Automotive
ocean search people \
  --people-filters '{"jobTitleKeywords":{"anyOf":["VP Sales"]},"countries":["us"],"seniorities":["Director"]}' \
  --companies-filters '{"industries":["Automotive"]}' \
  --limit 10 --pretty

# Enrich one company (sync)
ocean enrich company --domain tesla.com --pretty

# Enrich one person by LinkedIn (sync)
ocean enrich person --linkedin "https://linkedin.com/in/example" --pretty
```

### Typical sourcing pipeline

```bash
ocean data-fields list
ocean autocomplete job-titles --query "vp sales"
ocean search people --people-filters '...' --limit 50
ocean reveal emails --ocean-ids "id1,id2" --webhook-url "https://yourapp.com/hooks/ocean"
```

Always run `ocean credits balance` before large searches or reveals. Check `dailyLimitRateLeft` for remaining API calls today.

---

## For AI agents

If you are an **LLM or coding agent** using this repo or MCP:

1. Read **[OCEAN.md](./OCEAN.md)** — filter shapes, webhook rules, MCP tool names, common mistakes.
2. Read **[AGENTS.md](./AGENTS.md)** — architecture, env vars, contributor notes.
3. Prefer **v3 search** (`search_companies`, `search_people`). Do **not** use v2 search tools — they are not registered in MCP.
4. Call **`data_fields_list`** before building filters; use **`autocomplete_*`** to normalize titles and locations.
5. **`jobTitleKeywords` must be an object**, not an array:

   ```json
   {"jobTitleKeywords":{"anyOf":["VP Sales"]},"countries":["us"]}
   ```

6. **Webhook required** for async bulk: `enrich_companies`, `enrich_people`, `reveal_emails`, `reveal_phones`.
7. **Domains** must be plain hostnames (`tesla.com`), not URLs with `https://` or paths.

### MCP tools (18)

| Tool | Purpose |
|------|---------|
| `credits_balance` | Search / email / phone credits and daily rate limit |
| `data_fields_list` | Valid filter field names for search |
| `search_companies` | v3 company search |
| `search_people` | v3 people search |
| `enrich_company` | Single company by domain (sync) |
| `enrich_person` | Single person by LinkedIn / email / name (sync) |
| `enrich_companies` | Bulk companies (async + webhook) |
| `enrich_people` | Bulk people (async + webhook) |
| `lookup_companies` | By domain |
| `lookup_people` | By LinkedIn handle or Ocean ID |
| `reveal_emails` | Async + webhook |
| `reveal_phones` | Async + webhook |
| `warmup_companies` | Pre-fetch company data |
| `autocomplete_companies` | Company name suggestions |
| `autocomplete_job_titles` | Job title suggestions |
| `autocomplete_locations` | Location suggestions |
| `autocomplete_keywords` | Keyword suggestions |
| `autocomplete_skills` | Skill suggestions |

CLI command names use spaces (`ocean search people`); MCP tool names use underscores (`search_people`).

---

## Global options

| Option | Description |
|--------|-------------|
| `--api-token <token>` | Override env var / stored config |
| `--output json\|pretty` | Output format (default: `json`) |
| `--pretty` | Shorthand for `--output pretty` |
| `--quiet` | Suppress stdout (exit code only) |
| `--fields <fields>` | Comma-separated fields (`ocean data-fields list` for names) |

Errors print structured JSON with `error` and `code` fields (not raw stack traces in default mode).

---

## Commands

### Credits & data fields

```bash
ocean credits balance
ocean credits balance --pretty
ocean data-fields list
```

### Search (v3 — recommended)

Pass filters as JSON on `--companies-filters` and/or `--people-filters`. `--filters` is an alias for the primary filter flag on each subcommand.

```bash
# Companies
ocean search companies \
  --companies-filters '{"industries":["Automotive"],"countries":["us"],"headcountMin":100}' \
  --limit 20

ocean search companies \
  --companies-filters '{"domains":["roush.com","tesla.com"]}' \
  --fields name,domain,employeeCountLinkedin

# People
ocean search people \
  --people-filters '{"jobTitleKeywords":{"anyOf":["VP Sales"]},"countries":["us"],"seniorities":["Director"]}' \
  --limit 50

ocean search people \
  --people-filters '{"jobTitleKeywords":{"anyOf":["engineer"]},"seniorities":["manager"]}' \
  --companies-filters '{"domains":["roush.com","rivian.com"]}'

# Pagination — pass searchAfter from the previous response (opaque cursor string)
ocean search companies \
  --companies-filters '{"industries":["Automotive"],"countries":["us"]}' \
  --limit 50 \
  --search-after "NoWgjANARA0l..."
```

### Enrich

**Single record (sync, no webhook):**

```bash
ocean enrich company --domain tesla.com
ocean enrich company --domain stripe.com --pretty

ocean enrich person --linkedin "https://linkedin.com/in/satyanadella"
ocean enrich person --ocean-id "<ocean-person-id>"
ocean enrich person --name "Jane Doe" --company-domain acme.com
```

Use plain domains only (`tesla.com`), not full URLs.

**Bulk (async — requires `--webhook-url`):**

```bash
ocean enrich companies \
  --domains "stripe.com,twilio.com" \
  --webhook-url "https://yourapp.com/webhooks/ocean"

ocean enrich people \
  --linkedin-urls "https://linkedin.com/in/johndoe,https://linkedin.com/in/janedoe" \
  --webhook-url "https://yourapp.com/webhooks/ocean"

ocean enrich people \
  --ocean-ids "id1,id2" \
  --webhook-url "https://yourapp.com/webhooks/ocean"
```

### Lookup

```bash
ocean lookup companies --domains "roush.com,stripe.com"
ocean lookup people --linkedin-handles "satyanadella,johndoe"
ocean lookup people --ocean-ids "id1,id2"
```

### Reveal (async — requires `--webhook-url`)

Results are delivered to your webhook URL.

```bash
ocean reveal emails \
  --ocean-ids "id1,id2" \
  --webhook-url "https://yourapp.com/webhooks/ocean"

ocean reveal phones \
  --ocean-ids "id1" \
  --webhook-url "https://yourapp.com/webhooks/ocean"
```

### Warmup

```bash
ocean warmup companies --domains "hubspot.com,salesforce.com"
```

### Autocomplete

```bash
ocean autocomplete companies --query "Tesla"
ocean autocomplete job-titles --query "vp eng"
ocean autocomplete locations --query "San Francisco"
ocean autocomplete keywords --query "saas"
ocean autocomplete skills --query "python"
```

---

## MCP server

Every non-deprecated command is available as an MCP tool. Start the local stdio server:

```bash
ocean mcp
```

### Cursor / Claude Desktop / VS Code

**Global install:**

```json
{
  "mcpServers": {
    "ocean": {
      "command": "ocean",
      "args": ["mcp"],
      "env": { "OCEAN_API_TOKEN": "your-token-here" }
    }
  }
}
```

**Without global install:**

```json
{
  "mcpServers": {
    "ocean": {
      "command": "npx",
      "args": ["ocean-agent-cli", "mcp"],
      "env": { "OCEAN_API_TOKEN": "your-token-here" }
    }
  }
}
```

### Hosted MCP (no local process)

```
https://api.ocean.io/mcp/?api-token=<your-token>
```

Use this URL in clients that support remote MCP endpoints.

---

## API reference

| CLI command | Method | Endpoint |
|-------------|--------|----------|
| `credits balance` | GET | `/v2/credits/balance` |
| `data-fields list` | GET | `/v2/data-fields` |
| `search companies` | POST | `/v3/search/companies` |
| `search people` | POST | `/v3/search/people` |
| `enrich company` | POST | `/v2/enrich/company` |
| `enrich companies` | POST | `/v2/enrich/companies` |
| `enrich person` | POST | `/v2/enrich/person` |
| `enrich people` | POST | `/v2/enrich/people` |
| `lookup companies` | POST | `/v2/lookup/companies` |
| `lookup people` | POST | `/v2/lookup/people` |
| `reveal emails` | POST | `/v2/reveal/emails` |
| `reveal phones` | POST | `/v2/reveal/phones` |
| `warmup companies` | POST | `/v2/warmup/companies` |
| `autocomplete companies` | POST | `/v2/autocomplete/companies` |
| `autocomplete keywords` | POST | `/v2/autocomplete/keywords` |
| `autocomplete job-titles` | POST | `/v2/autocomplete/job-titles` |
| `autocomplete locations` | POST | `/v2/autocomplete/locations` |
| `autocomplete skills` | POST | `/v2/autocomplete/skills` |

- **Search base URL:** `https://api.ocean.io/v3/`
- **All other endpoints:** `https://api.ocean.io/v2/`
- **Auth header:** `X-Api-Token: <your-token>`

Full API documentation: [app.ocean.io/docs](https://app.ocean.io/docs)

---

## Development

```bash
git clone https://github.com/bcharleson/ocean-agent-cli.git
cd ocean-agent-cli
npm install
npm run dev -- credits balance --pretty   # run from source via tsx
npm test
npm run typecheck
npm run build                             # outputs to dist/
```

### Project layout

```
src/
  index.ts          # CLI entry (commander)
  mcp.ts            # MCP entry
  core/             # auth, client, handler, output, validation
  commands/         # one file per API command
```

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | [github.com/bcharleson/ocean-agent-cli](https://github.com/bcharleson/ocean-agent-cli) |
| npm | [npmjs.com/package/ocean-agent-cli](https://www.npmjs.com/package/ocean-agent-cli) |
| Ocean.io | [ocean.io](https://www.ocean.io?aff=NvIcVnxrnAca) |
| Ocean API docs | [app.ocean.io/docs](https://app.ocean.io/docs) |
| Agent playbook | [OCEAN.md](./OCEAN.md) |
| Contributor guide | [AGENTS.md](./AGENTS.md) |

---

## License

MIT — see [LICENSE](./LICENSE).

<p align="center">
  <sub>Logo © <a href="https://www.ocean.io?aff=NvIcVnxrnAca">Ocean.io</a>. Not affiliated with or endorsed by Ocean.io unless stated otherwise.</sub>
</p>
