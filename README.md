# 17NAS MCP Server

Free network diagnostic tools as an MCP server. No API key required.

## Tools

- **get_ip_info** — Public IP info: address, IPv4/IPv6 protocol, country, ASN, location (via 17NAS API)
- **dns_lookup** — DNS records (A, AAAA, MX, TXT, NS, CNAME) via DNS-over-HTTPS
- **check_ipv6** — IPv6 reachability: AAAA resolution + TCP connectivity test over IPv6 vs IPv4

## Install

```bash
npm install
Use with Claude Desktop
json


{
  "mcpServers": {
    "17nas": {
      "command": "node",
      "args": ["/path/to/17nas-mcp/src/index.js"]
    }
  }
}
Links
Website: https://17nas.com
IPv6 Test: https://17nas.com/ipv6-test.php
Registry: https://registry.modelcontextprotocol.io
MIT License.
