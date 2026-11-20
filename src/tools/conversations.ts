import type { ConversationMeta, ConversationState } from "crisp-api";
import { paginate } from "./pagination.ts";
import { segment } from "./paths.ts";
import { handler, type ToolContext, type ToolHandler } from "./types.ts";

interface Session {
  session_id: string;
}

// The official schema calls the conversation inbox default "all"; Crisp lists all inboxes without a filter.
const ALL_INBOXES = "all";

const SEARCH_TYPES = { text: "text", segments: "segment" } as const;

function updateMeta(
  { website, websiteId }: ToolContext,
  sessionId: string,
  meta: ConversationMeta,
) {
  return website.updateConversationMetas(websiteId, segment(sessionId), meta);
}

function sendMessage(
  { website, websiteId }: ToolContext,
  sessionId: string,
  message: { type: "text" } | { type: "note"; mentions?: string[] },
  text: string,
) {
  return website.sendMessageInConversation(websiteId, segment(sessionId), {
    ...message,
    from: "operator",
    origin: "chat",
    content: text,
  });
}

export const conversationTools: Record<string, ToolHandler> = {
  list_latest_conversations: handler((_args, { website, websiteId }) =>
    website.listConversations(websiteId, 1),
  ),

  list_conversations_at_page: handler<{ page: number; inbox_id: string }>(
    async ({ page, inbox_id }, { website, websiteId }) => {
      const filter = inbox_id === ALL_INBOXES ? {} : { filter_inbox_id: inbox_id };
      const { items, pagination } = paginate(
        await website.listConversations(websiteId, page, filter),
        page,
      );
      return { conversations: items, pagination };
    },
  ),

  search_conversations: handler<{ search_query: string; search_in: keyof typeof SEARCH_TYPES }>(
    ({ search_query, search_in }, { website, websiteId }) =>
      website.listConversations(websiteId, 1, {
        search_type: SEARCH_TYPES[search_in],
        search_query,
      }),
  ),

  get_conversation: handler<Session>(({ session_id }, { website, websiteId }) =>
    website.getConversation(websiteId, segment(session_id)),
  ),

  list_latest_conversation_messages: handler<Session>(({ session_id }, { website, websiteId }) =>
    website.getMessagesInConversation(websiteId, segment(session_id)),
  ),

  send_conversation_message_text: handler<Session & { text: string }>(({ session_id, text }, ctx) =>
    sendMessage(ctx, session_id, { type: "text" }, text),
  ),

  send_conversation_message_note: handler<Session & { text: string; mentions?: string[] }>(
    ({ session_id, text, mentions }, ctx) =>
      sendMessage(ctx, session_id, { type: "note", ...(mentions && { mentions }) }, text),
  ),

  set_conversation_full_name: handler<Session & { full_name: string }>(
    ({ session_id, full_name }, ctx) => updateMeta(ctx, session_id, { nickname: full_name }),
  ),

  set_conversation_email: handler<Session & { email: string }>(({ session_id, email }, ctx) =>
    updateMeta(ctx, session_id, { email }),
  ),

  set_conversation_phone: handler<Session & { phone: string }>(({ session_id, phone }, ctx) =>
    updateMeta(ctx, session_id, { phone }),
  ),

  change_conversation_state: handler<Session & { state: ConversationState }>(
    ({ session_id, state }, { website, websiteId }) =>
      website.changeConversationState(websiteId, segment(session_id), state),
  ),

  move_conversation_inbox: handler<Session & { inbox_id: string }>(
    ({ session_id, inbox_id }, { website, websiteId }) =>
      website.updateConversationInbox(websiteId, segment(session_id), inbox_id),
  ),
};
