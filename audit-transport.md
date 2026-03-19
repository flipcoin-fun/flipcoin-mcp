# Transport Audit — FlipCoin MCP Server

**Date**: 2026-03-19
**Scope**: Transport layer, deployment readiness, authentication

---

## 1. No HTTP/SSE Transport

**Status**: ❌ Gap — Only `StdioServerTransport` is used.

`src/index.ts` imports exclusively from `@modelcontextprotocol/sdk/server/stdio.js`. The server can only run as a stdio subprocess (npx, Claude Desktop config). Cannot be deployed as a hosted HTTP endpoint.

**Recommendation**: Add dual-mode startup — when `PORT` env is set, start HTTP server with `StreamableHTTPServerTransport` + legacy `SSEServerTransport`.

---

## 2. SDK Version ^1.12.1

**Status**: ✅ Compatible — SDK includes both transports, no upgrade needed.

- `StreamableHTTPServerTransport` at `@modelcontextprotocol/sdk/server/streamableHttp.js` (since v1.8.0)
- `SSEServerTransport` at `@modelcontextprotocol/sdk/server/sse.js` (legacy)

---

## 3. Dockerfile Gaps

**Status**: ⚠️ Stdio-only

| Issue | Current | Required for HTTP |
|-------|---------|-------------------|
| `EXPOSE` | Missing | `EXPOSE 3000` |
| `PORT` env | Not set | `ENV PORT=3000` |
| `ENTRYPOINT` | `["node", "dist/index.js"]` | OK (works for both if code checks `PORT`) |
| Health check | Missing | Optional `HEALTHCHECK` |

---

## 4. No Auth Middleware for HTTP Mode

**Status**: ⚠️ Needed for HTTP deployment

Stdio is implicitly authenticated (local subprocess). HTTP mode needs Bearer token validation on incoming connections.

---

## Summary

| Finding | Severity | Effort |
|---------|----------|--------|
| Stdio-only transport | Gap | Medium |
| SDK supports HTTP | Info | None |
| Dockerfile missing HTTP config | Low | Low |
| No auth middleware | Medium | Medium |
