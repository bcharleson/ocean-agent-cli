# ocean-cli

CLI and MCP server for the [Ocean.io](https://ocean.io) data enrichment platform.

## Installation

```bash
npm install -g ocean-cli
```

## Authentication

```bash
# Interactive login
ocean login

# Or use environment variable
export OCEAN_API_TOKEN=your-token-here

# Or pass inline
ocean credits balance --api-token your-token-here
```

Config is stored at `~/.ocean/config.json`.

## Usage

### Credits
```bash
ocean credits balance
```

### Data Fields
```bash
ocean data-fields list
```

### Search
```bash
ocean search companies --domains "acme.com,example.com"
ocean search companies --filters '{"industry":["Technology"]}' --limit 50
ocean search people --domains "acme.com" --filters '{"jobTitle":["CEO"]}'
ocean search companies-v2 --filters '{"industry":["SaaS"]}'  # deprecated
ocean search people-v2 --filters '{"jobTitle":["VP"]}'        # deprecated
```

### Enrich
```bash
ocean enrich company --domain acme.com
ocean enrich companies --domains "acme.com,example.com"
ocean enrich person --linkedin-url "https://linkedin.com/in/johndoe"
ocean enrich person --ocean-id "abc123"
ocean enrich people --linkedin-urls "https://linkedin.com/in/johndoe,https://linkedin.com/in/janedoe"
ocean enrich people --ocean-ids "abc123,def456"
```

### Lookup
```bash
ocean lookup companies --domains "acme.com,example.com"
ocean lookup people --linkedin-handles "johndoe,janedoe"
ocean lookup people --ocean-ids "abc123,def456"
```

### Reveal
```bash
ocean reveal emails --ocean-ids "abc123,def456"
ocean reveal phones --ocean-ids "abc123,def456"
```

### Warmup
```bash
ocean warmup companies --domains "acme.com,example.com"
```

### Autocomplete
```bash
ocean autocomplete companies --query "Acme"
ocean autocomplete keywords --query "saas"
ocean autocomplete job-titles --query "engineer"
ocean autocomplete locations --query "San Francisco"
ocean autocomplete skills --query "python"
```

## Output Options

```bash
# Pretty-print JSON
ocean credits balance --pretty

# Select specific fields
ocean search companies --domains "acme.com" --fields "name,domain"

# Quiet mode (exit code only)
ocean credits balance --quiet
```

## MCP Server

Use ocean-cli as an MCP server for AI assistants:

```bash
ocean mcp
```

### MCP Configuration

Add to your Claude Desktop / Cursor / VS Code MCP config:

```json
{
  "mcpServers": {
    "ocean": {
      "command": "npx",
      "args": ["ocean-cli", "mcp"],
      "env": {
        "OCEAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## API Endpoints

| Command | Method | Endpoint |
|---------|--------|----------|
| `credits balance` | GET | `/v2/credits/balance` |
| `data-fields list` | GET | `/v2/data-fields` |
| `search companies` | POST | `/v3/search/companies` |
| `search companies-v2` | POST | `/v2/search/companies` |
| `search people` | POST | `/v3/search/people` |
| `search people-v2` | POST | `/v2/search/people` |
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

## License

MIT
