import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { describe, expect, it, vi } from "vitest";
import snapshot from "./official-tools.json" with { type: "json" };
import { createServer } from "./server.ts";
import { toolHandlers } from "./tools/index.ts";
import type { CrispWebsite } from "./tools/types.ts";

const WEBSITE_ID = "website-1";
type CrispCall = (...args: unknown[]) => Promise<unknown>;

function fakeWebsite(methods: Partial<Record<keyof CrispWebsite, unknown>>): CrispWebsite {
  return methods as unknown as CrispWebsite;
}

async function connect(website: CrispWebsite) {
  const server = createServer(toolHandlers, { website, websiteId: WEBSITE_ID });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

async function callText(client: Client, name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content.find((block) => block.type === "text")?.text ?? "";
  return { isError: result.isError === true, text };
}

describe("tool surface", () => {
  it("has a handler for exactly the official tools", () => {
    const official = snapshot.tools.map((tool) => tool.name).toSorted();
    expect([...toolHandlers.keys()].toSorted()).toEqual(official);
  });

  it("lists the official tools and instructions verbatim", async () => {
    const client = await connect(fakeWebsite({}));
    const { tools } = await client.listTools();
    expect(tools.map(({ name, description }) => ({ name, description }))).toEqual(
      snapshot.tools.map(({ name, description }) => ({ name, description })),
    );
    expect(tools.find((tool) => tool.name === "search_conversations")?.inputSchema).toEqual(
      snapshot.tools.find((tool) => tool.name === "search_conversations")?.inputSchema,
    );
    expect(client.getInstructions()).toBe(snapshot.instructions);
  });
});

describe("tool calls", () => {
  it("applies schema defaults before calling Crisp", async () => {
    const changeConversationState = vi.fn<CrispCall>().mockResolvedValue({});
    const client = await connect(fakeWebsite({ changeConversationState }));
    await callText(client, "change_conversation_state", { session_id: "session_1" });
    expect(changeConversationState).toHaveBeenCalledWith(WEBSITE_ID, "session_1", "resolved");
  });

  it("rejects invalid arguments without calling Crisp", async () => {
    const sendMessageInConversation = vi.fn<CrispCall>();
    const client = await connect(fakeWebsite({ sendMessageInConversation }));
    const result = await callText(client, "send_conversation_message_text", { session_id: "s" });
    expect(result.isError).toBe(true);
    expect(result.text).toContain("Invalid arguments");
    expect(sendMessageInConversation).not.toHaveBeenCalled();
  });

  it("maps the segments search to Crisp's segment search type", async () => {
    const listConversations = vi.fn<CrispCall>().mockResolvedValue([]);
    const client = await connect(fakeWebsite({ listConversations }));
    await callText(client, "search_conversations", { search_query: "vip", search_in: "segments" });
    expect(listConversations).toHaveBeenCalledWith(WEBSITE_ID, 1, {
      search_type: "segment",
      search_query: "vip",
    });
  });

  it("sends an internal note with mentions as an operator", async () => {
    const sendMessageInConversation = vi.fn<CrispCall>().mockResolvedValue({ fingerprint: 1 });
    const client = await connect(fakeWebsite({ sendMessageInConversation }));
    await callText(client, "send_conversation_message_note", {
      session_id: "s1",
      text: "check this",
      mentions: ["user-1"],
    });
    expect(sendMessageInConversation).toHaveBeenCalledWith(WEBSITE_ID, "s1", {
      type: "note",
      mentions: ["user-1"],
      from: "operator",
      origin: "chat",
      content: "check this",
    });
  });

  it("encodes an email used as a people identifier", async () => {
    const getPeopleProfile = vi.fn<CrispCall>().mockResolvedValue({});
    const client = await connect(fakeWebsite({ getPeopleProfile }));
    await callText(client, "get_people_profile", { people_id_or_email: "a+b@example.com" });
    expect(getPeopleProfile).toHaveBeenCalledWith(WEBSITE_ID, "a%2Bb%40example.com");
  });

  it("encodes each knowledge base tree path segment and keeps the slashes", async () => {
    const resolveHelpdeskTreeContent = vi.fn<CrispCall>().mockResolvedValue({ content: "# Hi" });
    const client = await connect(fakeWebsite({ resolveHelpdeskTreeContent }));
    const result = await callText(client, "get_helpdesk_tree_path_content", {
      tree_path: "setup guide/first steps.md",
    });
    expect(resolveHelpdeskTreeContent).toHaveBeenCalledWith(
      WEBSITE_ID,
      "en",
      "articles",
      "setup%20guide/first%20steps.md",
    );
    expect(JSON.parse(result.text)).toEqual({ content: "# Hi" });
  });

  it("leaves the workspace ID out of results at every depth", async () => {
    const listConversations = vi
      .fn<CrispCall>()
      .mockResolvedValue([{ session_id: "s1", website_id: WEBSITE_ID, meta: { nickname: "Ana" } }]);
    const client = await connect(fakeWebsite({ listConversations }));
    const result = await callText(client, "list_latest_conversations", {});
    expect(result.text).not.toContain(WEBSITE_ID);
    expect(JSON.parse(result.text)).toEqual([{ session_id: "s1", meta: { nickname: "Ana" } }]);
  });

  it("reports the next page while a page has results", async () => {
    const listConversations = vi.fn<CrispCall>().mockResolvedValue([{ session_id: "s1" }]);
    const client = await connect(fakeWebsite({ listConversations }));
    const result = await callText(client, "list_conversations_at_page", { page: 3 });
    expect(JSON.parse(result.text).pagination).toEqual({
      page: 3,
      is_partial_result: true,
      next_page: 4,
    });
    expect(listConversations).toHaveBeenCalledWith(WEBSITE_ID, 3, {});
  });

  it("stops paging at the first empty page", async () => {
    const listHelpdeskLocales = vi
      .fn<CrispCall>()
      .mockResolvedValueOnce([{ locale: "en" }])
      .mockResolvedValueOnce([]);
    const client = await connect(fakeWebsite({ listHelpdeskLocales }));
    const result = await callText(client, "list_helpdesk_locales", {});
    expect(JSON.parse(result.text)).toEqual({
      locales: [{ locale: "en" }],
      is_partial_result: false,
    });
    expect(listHelpdeskLocales).toHaveBeenCalledTimes(2);
  });

  it("returns Crisp's rejection reason as a tool error", async () => {
    const listWebsiteOperators = vi.fn<CrispCall>().mockRejectedValue({
      reason: "error",
      message: "token_scope_forbidden",
      code: 403,
    });
    const client = await connect(fakeWebsite({ listWebsiteOperators }));
    expect(await callText(client, "list_operators", {})).toEqual({
      isError: true,
      text: "Got error reason: 'token_scope_forbidden'",
    });
  });
});
