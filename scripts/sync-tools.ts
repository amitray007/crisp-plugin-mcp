import { writeFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const OFFICIAL_URL = new URL("https://api.crisp.chat/mcp/");
const SNAPSHOT_PATH = new URL("../src/official-tools.json", import.meta.url);

// Crisp serves tools/list and the server instructions without authentication.
const client = new Client({ name: "crisp-plugin-mcp-sync", version: "0.0.0" });
await client.connect(new StreamableHTTPClientTransport(OFFICIAL_URL));
const { tools } = await client.listTools();
const snapshot = {
  instructions: client.getInstructions() ?? "",
  tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
};
await client.close();

await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${snapshot.tools.length} tools to ${SNAPSHOT_PATH.pathname}`);
