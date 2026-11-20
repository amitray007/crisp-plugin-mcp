# crisp-plugin-mcp

An MCP server with the same tools as Crisp's hosted MCP server (`https://api.crisp.chat/mcp/`).
It signs in with a Crisp Marketplace plugin token instead of the workspace MCP token.

Crisp's hosted server accepts only the workspace MCP token. Generating that token also replaces
the workspace REST API token, which breaks integrations that use the old one. A plugin token
leaves the workspace tokens unchanged.

## Use

Add the server to your MCP client:

```json
{
  "mcpServers": {
    "crisp": {
      "command": "npx",
      "args": ["-y", "crisp-plugin-mcp"],
      "env": {
        "CRISP_TOKEN_IDENTIFIER": "<plugin token identifier>",
        "CRISP_TOKEN_KEY": "<plugin token key>",
        "CRISP_WEBSITE_ID": "<website ID>"
      }
    }
  }
}
```

The server needs Node.js 22 or later.

## Get a plugin token

1. Sign in to the [Crisp Marketplace](https://marketplace.crisp.chat/).
2. Create a private plugin.
3. On the plugin's Tokens page, request a production token with the scopes your tools need.
   A development token works at once, with a low daily quota.
4. Install the plugin on your workspace with its private install link.

The website ID is in Crisp under Settings → Workspace Settings → Setup Instructions.

A tool works only when the token has the matching scope. Otherwise the tool returns
`Got error reason: 'token_scope_forbidden'`. Each call counts against the plugin's daily quota.

## How it matches the official server

- `src/official-tools.json` is a copy of the official tool list and server instructions. Crisp
  serves both without authentication. This server lists them unchanged.
- Each tool calls the Crisp REST API through Crisp's `crisp-api` client, with plugin-tier
  authentication.
- Errors use the official text: `Got error reason: '<reason>'`.
- Results contain the REST API data without `website_id` fields, because every tool targets the
  configured workspace. The official server can shape its results differently.
- `report_feedback_missing_tool` has no REST API route. It returns `sent: false` and a note.

## Development

mise pins Node and pnpm.

- `pnpm install`, then `pnpm build`.
- `pnpm check`: format check, lint, typecheck, tests, and Knip.
- `pnpm smoke`: start the built server with placeholder credentials and check its tool list.
- `pnpm smoke:live`: call read-only tools against the workspace set in the environment.
- `pnpm sync-tools`: copy the latest tool list from Crisp. The Git diff on
  `src/official-tools.json` shows what changed. Update the handlers in `src/tools/` to match.

Releases are automatic. See [docs/releasing.md](docs/releasing.md).

## License

MIT
