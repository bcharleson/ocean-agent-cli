# ocean-agent-cli — Agent & Contributor Guidelines

## What is ocean-agent-cli?

`ocean-agent-cli` is an open-source CLI and MCP (Model Context Protocol) server for the [Ocean.io](https://ocean.io) data enrichment API. It mirrors the architecture of [instantly-cli](https://github.com/bcharleson/instantly-cli) and lets AI agents and developers search companies, find people, enrich profiles, reveal emails/phones, and more — all from the terminal or via any MCP-compatible AI assistant (Claude, Cursor, Windsurf, VS Code).

## Quick Start

```bash
# Install
npm install -g ocean-agent-cli

# Authenticate
ocean login

# Check credits
ocean credits balance --pretty

# Search people
ocean search people \
  --people-filters '{"jobTitleKeywords":{"anyOf":["instrumentation manager"]},"countries":["us"]}' \
  --limit 20 --pretty

# Enrich a person by LinkedIn URL
ocean enrich person --linkedin "https://linkedin.com/in/robbielane" --pretty

# Reveal emails for a person
ocean reveal emails --person-id "<ocean-person-id>" --pretty

# Start the MCP server
ocean mcp
```

## Architecture

Mirrors [instantly-cli](https://github.com/bcharleson/instantly-cli) exactly:

```
src/
  index.ts              # CLI entry point (commander)
  mcp.ts                # MCP server entry point
  core/
    auth.ts             # Token storage (~/.ocean/config.json)
    client.ts           # HTTP client (fetch + X-Api-Token header)
    config.ts           # Config file helpers
    errors.ts           # Error formatting
    handler.ts          # Generic command executor
    output.ts           # JSON / pretty / quiet / --fields output
    types.ts            # CommandDefinition, GlobalOptions, CliMapping
  commands/
    auth/               # login, logout
    autocomplete/       # companies, job-titles, keywords, locations, skills
    credits/            # balance
    data-fields/        # list
    enrich/             # company, person, companies (bulk), people (bulk)
    lookup/             # companies, people
    reveal/             # emails, phones
    search/             # companies (v3), people (v3), companies-v2, people-v2
    warmup/             # companies
    mcp/                # MCP server start
```

## Ocean.io API Key Formats

- **Filter format for `search people`**: `jobTitleKeywords` is an object: `{"anyOf": [...], "allOf": [...], "noneOf": [...]}` — NOT a plain array
- **Base URL**: `https://api.ocean.io/v2/` (most endpoints) and `https://api.ocean.io/v3/` (search)
- **Auth header**: `X-Api-Token: <your-token>`
- **MCP URL**: `https://api.ocean.io/mcp/?api-token=<your-token>`

## Commands Reference

### Auth
```bash
ocean login                          # Interactive login (saves to ~/.ocean/config.json)
ocean logout                         # Remove stored token
```

### Credits
```bash
ocean credits balance                # Check credit balances (search, email, phone)
```

### Search (v3 — recommended)
```bash
# Search people
ocean search people \
  --people-filters '{"jobTitleKeywords":{"anyOf":["instrumentation manager"]},"countries":["us"],"seniorities":["manager"]}' \
  --companies-filters '{"domains":["roush.com","rivian.com"]}' \
  --limit 50

# Search companies
ocean search companies \
  --companies-filters '{"industries":["Automotive"],"countries":["us"],"headcountMin":100}' \
  --limit 20
```

### Enrich
```bash
ocean enrich person --linkedin "https://linkedin.com/in/example"
ocean enrich company --domain "tesla.com"
ocean enrich people --file people.json                 # bulk
ocean enrich companies --file companies.json           # bulk
```

### Lookup
```bash
ocean lookup people --ids '["id1","id2"]'
ocean lookup companies --ids '["id1","id2"]'
```

### Reveal
```bash
ocean reveal emails --person-id "<id>"
ocean reveal phones --person-id "<id>"
```

### Autocomplete
```bash
ocean autocomplete job-titles --query "instrumentation"
ocean autocomplete locations --query "Nevada"
ocean autocomplete companies --query "roush"
ocean autocomplete skills --query "data acquisition"
ocean autocomplete keywords --query "test"
```

### Data Fields
```bash
ocean data-fields list               # List all available filter fields
```

### MCP Server
```bash
ocean mcp                            # Start MCP server (stdio transport)
```

#### Claude Desktop config (`~/.claude/claude_desktop_config.json`):
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

## Global Options
```
--api-token <token>   Override OCEAN_API_TOKEN env var / stored config
--output <format>     json (default) or pretty
--pretty              Shorthand for --output pretty
--quiet               Suppress output (exit code only)
--fields <fields>     Comma-separated fields to include (e.g. --fields firstName,lastName,title)
```

## Environment Variables
```
OCEAN_API_TOKEN       Your Ocean.io API token
```

## Config File
Stored at `~/.ocean/config.json`:
```json
{ "api_token": "your-token-here" }
```

## Development
```bash
npm install
npm run dev -- credits balance --pretty    # Run without building
npm run build                               # Build to dist/
npm run typecheck                           # TypeScript check
```

## Key Differences from instantly-cli
- Auth header: `X-Api-Token` (not `Authorization: Bearer`)
- Config dir: `~/.ocean/` (not `~/.instantly/`)
- Two API versions: v2 (most endpoints) and v3 (search)
- `jobTitleKeywords` filter is an object `{anyOf, allOf, noneOf}` not a plain array
- MCP server available at `https://api.ocean.io/mcp/?api-token=<token>` (hosted) or via `ocean mcp` (local)

## Notes for AI Agents
- When building sourcing pipelines: use `search people` → `reveal emails` → outreach
- Credit types: search credits (recurrent monthly), email credits (one-time), phone credits (one-time)
- `dailyLimitRateLeft` in `credits balance` shows how many API calls remain today
- Always check `credits balance` before running bulk operations
