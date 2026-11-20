import { handler, type ToolHandler } from "./types.ts";

// Crisp's feedback channel is internal to its hosted MCP server and has no REST route.
const FEEDBACK_UNAVAILABLE =
  "This server cannot send feedback to the Crisp team. Tell the user which action is missing so they can report it to Crisp directly.";

export const feedbackTools: Record<string, ToolHandler> = {
  report_feedback_missing_tool: handler(async () => ({
    sent: false,
    message: FEEDBACK_UNAVAILABLE,
  })),
};
