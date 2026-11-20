#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { Crisp } from "crisp-api";
import { readConfig } from "./config.ts";
import { createServer } from "./server.ts";
import { toolHandlers } from "./tools/index.ts";

const config = readConfig(process.env);
const crisp = new Crisp();
crisp.authenticateTier("plugin", config.identifier, config.key);

const context = { website: crisp.website, websiteId: config.websiteId };
serveStdio(() => createServer(toolHandlers, context));
