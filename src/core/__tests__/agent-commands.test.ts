import { describe, expect, it } from 'vitest';
import { agentCommands, allCommands } from '../../commands/index.js';

describe('agentCommands', () => {
  it('excludes deprecated v2 search from MCP surface', () => {
    const names = agentCommands.map((c) => c.name);
    expect(names).not.toContain('search_companies_v2');
    expect(names).not.toContain('search_people_v2');
    expect(names).toContain('search_companies');
    expect(names).toContain('search_people');
  });

  it('keeps deprecated commands in allCommands for CLI backwards compatibility', () => {
    const names = allCommands.map((c) => c.name);
    expect(names).toContain('search_companies_v2');
    expect(names).toContain('search_people_v2');
  });
});
