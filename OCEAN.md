# Ocean.io — Agent MCP Context

Use this file when calling Ocean via `ocean mcp` or the hosted MCP URL. **Only the tools listed below are registered** — deprecated v2 search is not exposed.

## Authentication

- Header: `X-Api-Token: <token>`
- Env: `OCEAN_API_TOKEN`
- Config: `~/.ocean/config.json` (`api_token`)
- Run `credits_balance` before bulk search/reveal to check limits.

## Recommended workflow

1. **`data_fields_list`** — discover valid filter field names.
2. **`autocomplete_*`** — normalize job titles, locations, companies, skills, keywords.
3. **`search_companies`** or **`search_people`** (v3) — find targets.
4. **`enrich_person`** / **`enrich_company`** — single-record enrichment (sync).
5. **`reveal_emails`** / **`reveal_phones`** — requires `--ocean-ids` and `--webhook-url` (async).
6. **`lookup_*`** — fetch records by Ocean IDs.

## Search (v3 only — use these MCP tools)

| Tool | CLI | Notes |
|------|-----|--------|
| `search_companies` | `ocean search companies` | `--companies-filters` JSON |
| `search_people` | `ocean search people` | `--people-filters` and optional `--companies-filters` |

### Filter rules (common mistakes)

- **People job titles**: `jobTitleKeywords` is an **object**, not an array:
  ```json
  {"jobTitleKeywords":{"anyOf":["VP Sales"]},"countries":["us"]}
  ```
- **Company domains in v3**: use `domains` in filters; the CLI maps to API `includeDomains`.
- **Headcount**: `headcountMin` / `headcountMax` in filters map to LinkedIn employee count + `companySizes`.
- **Do not use** `search_companies_v2` or `search_people_v2` — not registered in MCP.

## Async / webhook-required tools

These return immediately; results arrive at your webhook:

| Tool | Required args |
|------|----------------|
| `enrich_companies` | `domains`, `webhookUrl` |
| `enrich_people` | `linkedinUrls` or `oceanIds`, `webhookUrl` |
| `reveal_emails` | `oceanIds`, `webhookUrl` |
| `reveal_phones` | `oceanIds`, `webhookUrl` |

## Sync tools (no webhook)

- `enrich_company` — `--domain`
- `enrich_person` — `--linkedin` and/or `--email` / `--name`
- `search_*`, `lookup_*`, `credits_balance`, `warmup_companies`, `autocomplete_*`

## Output

- Default: JSON on stdout
- CLI: `--pretty`, `--fields name,title,domain` (search unwraps nested `company` / `person` objects)
- Errors: structured JSON with `error` and `code` (not `[object Object]`)

## API bases

- Search: `https://api.ocean.io/v3/`
- Most other endpoints: `https://api.ocean.io/v2/`
