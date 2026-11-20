# crisp-plugin-mcp

A stdio MCP server with the same tools as Crisp's hosted MCP server (`https://api.crisp.chat/mcp/`).
It authenticates with a Crisp Marketplace plugin token, not the workspace MCP token. Regenerating
the workspace MCP token also regenerates the workspace REST token, so this server avoids that reset.

## How it matches the official server

- `src/official-tools.json` is a snapshot of the official `tools/list` and server instructions.
  Crisp serves both without authentication. This server lists them unchanged.
- Each tool calls the Crisp REST API through the official `crisp-api` client with
  `X-Crisp-Tier: plugin`.
- Errors use the official text: `Got error reason: '<reason>'`.
- Response bodies are the REST API data. The official server may shape them differently.
- `report_feedback_missing_tool` has no REST route. It returns `sent: false` with a note.

## Configuration

| Variable                 | Value                   |
| ------------------------ | ----------------------- |
| `CRISP_TOKEN_IDENTIFIER` | Plugin token identifier |
| `CRISP_TOKEN_KEY`        | Plugin token key        |
| `CRISP_WEBSITE_ID`       | Workspace (website) ID  |

A tool works only when the plugin token has the matching scope. Without it, the tool returns
`Got error reason: 'token_scope_forbidden'`. Calls count against the plugin's daily quota.

## Commands

mise pins Node and pnpm.

- `pnpm install`, then `pnpm build`.
- `pnpm start`: run the server on stdio from `dist/`.
- `pnpm check`: format check, lint, typecheck, tests, and Knip.
- `pnpm smoke`: call read-only tools against the live workspace in the environment. Build first.
- `pnpm sync-tools`: refresh the snapshot from Crisp. A Git diff on `src/official-tools.json`
  shows what Crisp changed. Add or update handlers in `src/tools/` to match.

## MCP client entry

```json
{
  "command": "node",
  "args": ["/path/to/crisp-plugin-mcp/dist/index.js"],
  "env": {
    "CRISP_TOKEN_IDENTIFIER": "…",
    "CRISP_TOKEN_KEY": "…",
    "CRISP_WEBSITE_ID": "…"
  }
}
```
