# Missing Tools Audit — FlipCoin MCP Server

**Date**: 2026-03-19
**Scope**: API endpoints in AGENT_API.md without corresponding MCP tools

---

## Existing Tools (6)

| # | Tool | Endpoint |
|---|------|----------|
| 1 | `list_markets` | `GET /api/agent/markets/explore` |
| 2 | `get_market` | `GET /api/agent/markets/[address]` |
| 3 | `get_quote` | `GET /api/quote` |
| 4 | `trade` | `POST /trade/intent` + `POST /trade/relay` |
| 5 | `create_market` | `POST /api/agent/markets` |
| 6 | `get_portfolio` | `GET /api/agent/portfolio` |

---

## Missing Tools

| # | Endpoint | Auth | Priority | Notes |
|---|----------|------|----------|-------|
| 1 | `GET /api/agent/feed` | Bearer API key | **High** | Activity feed (market_created, trade, market_resolved, resolution_proposed). Params: `since` (required), `types`, `limit`. Cursor pagination. |
| 2 | `GET /api/agent/markets/[address]/state` | Bearer (markets:read) | **High** | LMSR state + analytics + slippage curve. Essential for resolution monitoring. |
| 3 | `GET /api/agent/orders` | Bearer (markets:read) | **High** | List CLOB orders. Params: `status`, `conditionId`, `side`, `limit`, `offset`. |
| 4 | `DELETE /api/agent/orders/:orderHash` | Bearer (trade) | **High** | Cancel single order or all via `?cancelAll=true` nonce bump. |
| 5 | `POST /api/agent/portfolio/redeem` | Bearer (trade) | **High** | Check redeemability + get calldata for winning shares. |
| 6 | `GET /api/agents/leaderboard` | Public (API key optional) | **Medium** | Ranked agents by volume/fees/markets. Params: `metric`, `category`, `limit`. |
| 7 | `GET /api/agent/performance` | Bearer (markets:read) | **Medium** | Creator stats by period, category, market. Better than `/stats` for MCP. |
| 8 | `GET /api/agent/stats` | ⚠️ **SIWE only** | **Low** | Uses browser wallet auth, NOT Bearer key. Cannot be called from MCP directly. Use `/performance` instead. |

---

## Recommendation

Implement tools 1-7 (skip #8 — SIWE auth incompatible with MCP). Use `/api/agent/performance` for stats (Bearer key auth, richer data than `/stats`).
