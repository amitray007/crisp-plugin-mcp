import { readFileSync } from "node:fs";
import { type CallToolResult, Server, type Tool } from "@modelcontextprotocol/server";
import * as z from "zod";
import snapshot from "./official-tools.json" with { type: "json" };
import type { ToolContext, ToolHandler } from "./tools/types.ts";

// package.json sits one level above both src/ and dist/.
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

const SERVER_INFO = { name: "crisp-plugin-mcp", version, title: "Crisp MCP" };

const officialTools = snapshot.tools as Tool[];

interface CrispApiError {
  message: string;
}

function isCrispApiError(error: unknown): error is CrispApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "reason" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

// Matches the error text of Crisp's hosted server, which reports the crisp-api rejection reason.
function errorResult(error: unknown): CallToolResult {
  const reason = isCrispApiError(error) ? error.message : "internal_error";
  return { isError: true, content: [{ type: "text", text: `Got error reason: '${reason}'` }] };
}

function textResult(text: string, isError = false): CallToolResult {
  return { ...(isError && { isError }), content: [{ type: "text", text }] };
}

function jsonResult(value: unknown): CallToolResult {
  return textResult(JSON.stringify(value ?? null));
}

function compileValidators(tools: Tool[]): Map<string, z.ZodType> {
  return new Map(
    tools.map((tool) => [
      tool.name,
      z.fromJSONSchema(tool.inputSchema as z.core.JSONSchema.JSONSchema),
    ]),
  );
}

export function createServer(handlers: ReadonlyMap<string, ToolHandler>, ctx: ToolContext): Server {
  const validators = compileValidators(officialTools);
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {} },
    instructions: snapshot.instructions,
  });

  server.setRequestHandler("tools/list", () => ({ tools: officialTools }));

  server.setRequestHandler("tools/call", async ({ params }) => {
    const validator = validators.get(params.name);
    const run = handlers.get(params.name);
    if (!validator || !run) return textResult(`Unknown tool: ${params.name}`, true);

    const args = validator.safeParse(params.arguments ?? {});
    if (!args.success) return textResult(`Invalid arguments: ${z.prettifyError(args.error)}`, true);

    try {
      return jsonResult(await run(args.data as Record<string, unknown>, ctx));
    } catch (error) {
      return errorResult(error);
    }
  });

  return server;
}
