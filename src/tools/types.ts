import type { Crisp } from "crisp-api";

export type CrispWebsite = Crisp["website"];

export interface ToolContext {
  website: CrispWebsite;
  websiteId: string;
}

export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;

// Arguments reach a handler only after they pass the tool's published JSON schema.
export function handler<Args>(
  run: (args: Args, ctx: ToolContext) => Promise<unknown>,
): ToolHandler {
  return (args, ctx) => run(args as Args, ctx);
}
