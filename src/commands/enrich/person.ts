import { z } from 'zod';
import { normalizeDomain } from '../../core/ocean-payloads.js';
import { optionalDomain } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const enrichPersonCommand: CommandDefinition = {
  name: 'enrich_person',
  group: 'enrich',
  subcommand: 'person',
  description: 'Enrich a single person by LinkedIn URL or Ocean ID',
  examples: [
    'ocean enrich person --linkedin "https://linkedin.com/in/johndoe"',
    'ocean enrich person --ocean-id "abc123"',
    'ocean enrich person --name "John Doe" --company-domain "acme.com"',
  ],

  inputSchema: z
    .object({
      linkedin: z.string().optional().describe('LinkedIn profile URL'),
      linkedinUrl: z.string().optional().describe('Alias for --linkedin'),
      oceanId: z.string().optional().describe('Ocean.io person ID'),
      name: z.string().optional().describe('Full name'),
      firstName: z.string().optional().describe('First name'),
      lastName: z.string().optional().describe('Last name'),
      email: z.string().optional().describe('Email address'),
      companyDomain: optionalDomain().describe('Company domain for matching'),
      revealEmails: z.boolean().optional().default(false).describe('Also reveal emails (uses email credits)'),
      revealPhones: z.boolean().optional().default(false).describe('Also reveal phones (uses phone credits)'),
    })
    .refine(
      (data) =>
        !!(
          data.linkedin ||
          data.linkedinUrl ||
          data.oceanId ||
          data.name ||
          data.email ||
          (data.firstName && data.lastName)
        ),
      {
        message:
          'Missing required option(s): provide at least one of --linkedin, --ocean-id, --name, --email, or --first-name and --last-name',
      },
    ),

  cliMappings: {
    options: [
      { field: 'linkedin', flags: '--linkedin <url>', description: 'LinkedIn profile URL' },
      { field: 'linkedinUrl', flags: '--linkedin-url <url>', description: 'Alias for --linkedin' },
      { field: 'oceanId', flags: '--ocean-id <id>', description: 'Ocean.io person ID' },
      { field: 'name', flags: '--name <name>', description: 'Full name' },
      { field: 'firstName', flags: '--first-name <name>', description: 'First name' },
      { field: 'lastName', flags: '--last-name <name>', description: 'Last name' },
      { field: 'email', flags: '--email <email>', description: 'Email address' },
      { field: 'companyDomain', flags: '--company-domain <domain>', description: 'Company domain' },
      { field: 'revealEmails', flags: '--reveal-emails', description: 'Reveal emails (uses email credits)' },
      { field: 'revealPhones', flags: '--reveal-phones', description: 'Reveal phones (uses phone credits)' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/person' },

  fieldMappings: {},

  handler: (input, client) => {
    const person: Record<string, any> = {};
    // --linkedin-url is an alias for --linkedin
    const linkedin = input.linkedin ?? input.linkedinUrl;
    if (linkedin) person.linkedin = linkedin;
    if (input.oceanId) person.id = input.oceanId;
    if (input.name) person.name = input.name;
    if (input.firstName) person.firstName = input.firstName;
    if (input.lastName) person.lastName = input.lastName;
    if (input.email) person.email = input.email;

    const body: Record<string, any> = { person };
    if (input.companyDomain) {
      body.company = { domain: normalizeDomain(String(input.companyDomain)) };
    }

    return client.post('/v2/enrich/person', body);
  },
};
