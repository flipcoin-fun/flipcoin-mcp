# Existing Tools Audit — FlipCoin MCP Server

**Date**: 2026-03-19
**Scope**: All 6 tools, client, types, utilities

---

## Findings

| # | Area | Rating | Details |
|---|------|--------|---------|
| 1 | Tool descriptions | ✅ OK | All 6 descriptions are accurate, LLM-friendly, describe inputs and expected outputs |
| 2 | Error handling | ✅ OK | `withErrorHandling()` wrapper + `client.ts` extracts `errorCode`/`error` from API JSON. `trade.ts` has custom per-step try/catch (correct for two-step flow) |
| 3 | Trade intent expiry | ✅ OK | Atomic intent→relay pattern. Relay failure returns `intentId`, `expiresAt`, "No funds were moved" |
| 4 | `createMarket` auto_sign | ✅ OK | Passed in POST body (preferred per AGENT_API.md), not query param |
| 5a | USDC in inputs | ✅ OK | `trade` and `get_quote` document "USDC base units (6 decimals, e.g. '1000000' = $1)" |
| 5b | USDC in responses | ⚠️ Minor | `get_portfolio` and `list_markets` don't clarify unit format of returned amounts |
| 6 | Input validation | ✅ OK | ETH_ADDRESS_REGEX, BYTES32_REGEX, URL validation, length limits, bps bounds |
| 7 | Client security | ✅ OK | HTTPS enforcement, 30s timeout, API key required, default uses `www.` URL |
| 8 | Type safety | ✅ OK | Zod schemas + TypeScript generics on `request<T>()` |
| 9 | Cross-tool hints | ⚠️ Minor | `get_quote` and `trade` require `conditionId` but don't hint to use `get_market` to obtain it |
| 10 | Response format | ✅ OK | All tools return `JSON.stringify(result, null, 2)` — readable for LLMs |

---

## Recommendations

1. Add unit format note to `get_portfolio` description: "Values in responses are human-readable (e.g. 8 = 8 shares, 4.0 = $4.00 USDC)"
2. Add cross-tool hint to `get_quote`/`trade`: "Get conditionId from the get_market tool response"
3. (Low priority) Dynamic intent expiry check in `trade.ts` — compare `Date.now()` vs `intent.expiresAt`

**Overall**: Well-built, no critical issues. Three minor improvements recommended.
