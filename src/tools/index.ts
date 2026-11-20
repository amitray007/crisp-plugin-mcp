import { conversationTools } from "./conversations.ts";
import { feedbackTools } from "./feedback.ts";
import { helpdeskTools } from "./helpdesk.ts";
import { peopleTools } from "./people.ts";
import type { ToolHandler } from "./types.ts";
import { workspaceTools } from "./workspace.ts";

export const toolHandlers: ReadonlyMap<string, ToolHandler> = new Map(
  Object.entries({
    ...workspaceTools,
    ...conversationTools,
    ...peopleTools,
    ...helpdeskTools,
    ...feedbackTools,
  }),
);
