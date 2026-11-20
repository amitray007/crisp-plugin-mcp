import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

// Calls only read-only tools against the live workspace configured in the environment.
const READ_ONLY_CALLS: [string, Record<string, unknown>][] = [
  ["get_website_information", {}],
  ["list_latest_conversations", {}],
  ["list_conversations_at_page", { page: 1 }],
  ["search_conversations", { search_query: "feed" }],
  ["list_helpdesk_locales", {}],
  ["list_helpdesk_tree", {}],
  ["search_helpdesk_tree", { search_query: "pixel" }],
  ["list_operators", {}],
];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  env: process.env as Record<string, string>,
});
const client = new Client({ name: "crisp-plugin-mcp-smoke", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`tools/list: ${tools.length} tools`);

async function call(name: string, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content.find((block) => block.type === "text")?.text ?? "";
  console.log(`${result.isError ? "ERROR" : "ok   "} ${name}: ${text.slice(0, 90)}`);
  return text;
}

for (const [name, args] of READ_ONLY_CALLS) await call(name, args);

const { pages } = JSON.parse(await call("list_helpdesk_pages", {})) as {
  pages: { tree_path: string }[];
};
const article = pages[0]?.tree_path;
if (article) {
  for (const name of [
    "get_helpdesk_tree_path_title",
    "get_helpdesk_tree_path_metadata",
    "get_helpdesk_tree_path_content",
  ]) {
    await call(name, { tree_path: article });
  }
}
await client.close();
