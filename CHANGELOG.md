# Changelog

## 1.1.0 (release candidate)

- Add `get_ip_full`, `get_ipv6_stats`, `get_my_rank`, and `check_nat`.
- Fix invalid JavaScript in the previous server entry point.
- Return consistent JSON text and structured results with sanitized errors.
- Document local-machine network scope and AI-provider data handling.
- Pin MCP SDK 1.32.1 and add protocol and upstream tests.

DNS results now use an object with `hostname`, `type`, `status`, and `records`, replacing the previous bare record array. Consumers must read `records`.
