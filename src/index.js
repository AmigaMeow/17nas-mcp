#!/usr/bin/env node
/**

17NAS MCP Server
Free network diagnostic tools as MCP tools.
https://17nas.com
*/
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
CallToolRequestSchema,
ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { lookup } from "node:dns/promises";
import { connect } from "node:net";
const server = new Server(
{ name: "17nas-network-tools", version: "1.0.0" },
{ capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
tools: [
{
name: "get_ip_info",
description: "Get public IP info: address, IPv4/IPv6, country, ASN, location",
inputSchema: { type: "object", properties: {} },
},
{
name: "dns_lookup",
description: "DNS lookup: A, AAAA, MX, TXT, NS, CNAME records",
inputSchema: {
type: "object",
properties: {
hostname: { type: "string", description: "Hostname to look up" },
type: { type: "string", description: "Record type", default: "A" },
},
required: ["hostname"],
},
},
{
name: "check_ipv6",
description: "Check IPv6 connectivity for a hostname",
inputSchema: {
type: "object",
properties: {
hostname: { type: "string", description: "Hostname to check" },
},
required: ["hostname"],
},
},
],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
const { name, arguments: args } = req.params;
if (name === "get_ip_info") {
const res = await fetch("https://ip.17nas.com/?format=json");
const data = await res.json();
return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
if (name === "dns_lookup") {
const type = (args.type || "A").toUpperCase();
const url = https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(args.hostname)}&type=${type};
const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
const data = await res.json();
return { content: [{ type: "text", text: JSON.stringify(data.Answer || [], null, 2) }] };
}
if (name === "check_ipv6") {
const hostname = args.hostname;
let hasAAAA = false, v6Ok = false, v4Ok = false;
try {
const v6 = await lookup(hostname, { family: 6 });
hasAAAA = !!v6.address;
if (hasAAAA) {
v6Ok = await new Promise((r) => {
const s = connect({ host: v6.address, port: 443, family: 6, timeout: 5000 });
s.on("connect", () => { s.end(); r(true); });
s.on("error", () => r(false));
s.on("timeout", () => { s.destroy(); r(false); });
});
}
} catch {}
try {
const v4 = await lookup(hostname, { family: 4 });
if (v4.address) {
v4Ok = await new Promise((r) => {
const s = connect({ host: v4.address, port: 443, family: 4, timeout: 5000 });
s.on("connect", () => { s.end(); r(true); });
s.on("error", () => r(false));
s.on("timeout", () => { s.destroy(); r(false); });
});
}
} catch {}
const result = { hostname, hasAAAA, ipv6_connectivity: v6Ok, ipv4_connectivity: v4Ok };
return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}
throw new Error(Unknown tool: ${name});
});

const transport = new StdioServerTransport();
await server.connect(transport);
