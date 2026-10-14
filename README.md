# 17NAS MCP Server

Local network diagnostics for Claude and other MCP clients. Version 1.1.0 adds combined network information, separately sourced IPv6 statistics, country query counts, and a browser NAT test link. No API key is required for the public tools.

## Install

Requires Node.js 20 or newer. After version 1.1.0 is published:

```json
{
  "mcpServers": {
    "17nas": {
      "command": "npx",
      "args": ["-y", "17nas-mcp-server@1.1.0"]
    }
  }
}
```

To run the checkout before publication, use `npm ci` and configure the command as `node` with the absolute path to `src/index.js`. Transport is stdio. Diagnostic results contain both JSON text and MCP `structuredContent`.

## Tools

| Tool | Input | Result |
| --- | --- | --- |
| `get_ip_info` | none | Public IP, protocol, country, ASN, location, priority, region, city, data center, timezone |
| `dns_lookup` | `hostname`, optional `type` | Public DNS records through Cloudflare DNS over HTTPS; A, AAAA, MX, TXT, NS, CNAME, SOA, SRV |
| `check_ipv6` | `hostname` | AAAA availability and IPv6/IPv4 TCP port 443 connectivity from the MCP machine |
| `get_ip_full` | optional `hostname` (default `cloudflare.com`) | IP information, IPv6 connectivity, browser NAT link |
| `get_ipv6_stats` | optional uppercase ISO `country` | 17NAS own country samples and separate APNIC Labs rates, ranks, dates and Top 5 |
| `get_my_rank` | none | Local machine's country query ordinal today, total, and statistics |
| `check_nat` | none | `natType: "unknown"` and browser NAT test URL |

The two aggregate tools require the independent App API to be deployed at `https://app.17nas.com`; they are not yet production-verified in this release checkout. Own rates require at least 300 samples in the rolling 30-day window. APNIC ranks cover the countries and territories in the exported snapshot and include the source and date. Sources are never blended. Query counts reset at UTC midnight and count queries, not unique people. Repeated counting is suppressed for one hour.

NAT detection runs in the browser on the linked page. The MCP process cannot determine a user's NAT type remotely. IPv6 connectivity measures the MCP host's ability to connect to the requested hostname, not the browser or a universal guarantee of IPv6 access.

## Data processing

This server runs on the machine where you install it. `get_ip_info` and `get_ip_full` contact the existing 17NAS IP service, which receives that machine's network source address and returns IP information. The existing website service has its own data recording policy; it is separate from the App's privacy boundary. DNS queries are sent to Cloudflare. Connectivity checks resolve and connect to the requested public host.

Tool results, including IP and ASN when requested, are delivered to your MCP client and may be processed by the AI provider configured in that client. Installing a local server does not bypass that provider's processing. This implementation does not persist results locally or log addresses. The aggregate tools call only the App-specific API; country determination occurs at its edge, with short-lived abuse HMACs and country totals as described in the App privacy policy.

## Development and release

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Tests cover the actual stdio handshake and seven-tool listing, NAT link output, validation, upstream errors, IP field mapping, and mocked independent aggregate calls. They do not prove a deployed App API is available.

Before publication, verify the App API, then run `npm publish` with authorized npm credentials. `server.json` declares `com.17nas/network-tools` version 1.1.0; authenticate with the MCP Registry publisher and publish this manifest after the npm package is live. Never claim registry publication from a local manifest alone.

[17NAS](https://17nas.com) · [IPv6 browser test](https://17nas.com/ipv6-test.php) · [NAT browser test](https://17nas.com/nat-test.php) · [Source](https://github.com/AmigaMeow/17nas-mcp)

MIT License.
