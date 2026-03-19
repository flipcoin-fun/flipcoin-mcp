#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { FlipCoinClient } from "./client.js";
import { listMarketsSchema, listMarkets } from "./tools/listMarkets.js";
import { getMarketSchema, getMarket } from "./tools/getMarket.js";
import { getQuoteSchema, getQuote } from "./tools/getQuote.js";
import { tradeSchema, trade } from "./tools/trade.js";
import { createMarketSchema, createMarket } from "./tools/createMarket.js";
import { getPortfolioSchema, getPortfolio } from "./tools/getPortfolio.js";
import {
  getMarketStateSchema,
  getMarketState,
} from "./tools/getMarketState.js";
import { getFeedSchema, getFeed } from "./tools/getFeed.js";
import { checkRedeemSchema, checkRedeem } from "./tools/checkRedeem.js";
import { getOrdersSchema, getOrders } from "./tools/getOrders.js";
import { cancelOrderSchema, cancelOrder } from "./tools/cancelOrder.js";
import { getStatsSchema, getStats } from "./tools/getStats.js";
import {
  getLeaderboardSchema,
  getLeaderboard,
} from "./tools/getLeaderboard.js";

const TOOL_COUNT = 12;

const apiKey = process.env.FLIPCOIN_API_KEY?.trim();
if (!apiKey) {
  console.error(
    "Error: FLIPCOIN_API_KEY environment variable is required (must not be empty)",
  );
  process.exit(1);
}

const baseUrl = process.env.FLIPCOIN_BASE_URL;
const client = new FlipCoinClient(apiKey, baseUrl);

// --- Tool registration helper ---

function registerTools(server: McpServer, flipClient: FlipCoinClient) {
  server.tool(
    "list_markets",
    "Browse prediction markets on FlipCoin. Filter by status, search by title, sort by volume/trades/deadline. Returns market address, title, status, volume, prices, and pagination.",
    listMarketsSchema.shape,
    (input) => listMarkets(flipClient, input),
  );

  server.tool(
    "get_market",
    "Get detailed information about a specific prediction market including current prices, recent trades, 24h stats, resolution fields, and volume breakdown by source (LMSR vs CLOB).",
    getMarketSchema.shape,
    (input) => getMarket(flipClient, input),
  );

  server.tool(
    "get_quote",
    "Get a price quote for buying or selling shares in a prediction market. Returns quotes from both LMSR (AMM) and CLOB (order book) with smart routing recommendation. No wallet required.",
    getQuoteSchema.shape,
    (input) => getQuote(flipClient, input),
  );

  server.tool(
    "trade",
    "Execute a trade (buy or sell) on a prediction market. Creates an intent and immediately relays it. Requires auto_sign delegation setup. Amount is in USDC base units (6 decimals: 1000000 = $1).",
    tradeSchema.shape,
    (input) => trade(flipClient, input),
  );

  server.tool(
    "create_market",
    "Create a new prediction market on FlipCoin. Requires title, resolution criteria, and resolution source URL. Optionally set category, liquidity tier, initial price. Requires auto_sign delegation for autonomous operation.",
    createMarketSchema.shape,
    (input) => createMarket(flipClient, input),
  );

  server.tool(
    "get_portfolio",
    "View the agent owner's portfolio: positions across all markets with shares, current value, P&L, and entry prices. Filter by market status (open/resolved/all).",
    getPortfolioSchema.shape,
    (input) => getPortfolio(flipClient, input),
  );

  server.tool(
    "get_market_state",
    "Check resolution status and LMSR state of a market. Returns current prices (YES/NO in basis points), LMSR pool quantities (qYes/qNo/b), 24h analytics (volume, trades, liquidity), and a slippage curve showing price impact at various trade sizes. Use this to monitor markets approaching resolution or to assess liquidity before trading.",
    getMarketStateSchema.shape,
    (input) => getMarketState(flipClient, input),
  );

  server.tool(
    "get_feed",
    "Get activity feed of platform events. Filter by type: 'market_created' (new markets), 'trade' (executed trades), 'market_resolved' (final outcomes), 'resolution_proposed' (markets entering 24h dispute period). Returns events with timestamps and market-specific payload. Use cursor-based pagination — pass the returned 'cursor' as 'since' in the next call.",
    getFeedSchema.shape,
    (input) => getFeed(flipClient, input),
  );

  server.tool(
    "check_redeem",
    "Check if you have winning shares to redeem in a resolved market. Pass the market's conditionId (from get_market response). If redeemable=true, returns transaction calldata that the owner wallet must submit on-chain to collect USDC winnings. Amounts are in USDC base units (6 decimals: 1000000 = $1).",
    checkRedeemSchema.shape,
    (input) => checkRedeem(flipClient, input),
  );

  server.tool(
    "get_orders",
    "List your CLOB (order book) orders. Filter by market conditionId, status, or side. Status 'open' includes partially_filled orders still active on the book. Returns orderHash, side, priceBps (price in basis points), totalShares, filledShares, filledPercent, and timestamps. Use orderHash from the response to cancel specific orders.",
    getOrdersSchema.shape,
    (input) => getOrders(flipClient, input),
  );

  server.tool(
    "cancel_order",
    "Cancel a CLOB order. Pass orderHash to cancel a specific order, or set cancelAll: true to cancel ALL open orders at once via on-chain nonce bump (affects all markets, irreversible). Mass cancel is a single transaction — efficient but cancels everything. Returns transaction hash for confirmation.",
    cancelOrderSchema.shape,
    (input) => cancelOrder(flipClient, input),
  );

  server.tool(
    "get_stats",
    "Get your agent's performance statistics: markets created, total trading volume, fees earned, volume breakdown by source (LMSR vs CLOB), and per-category breakdown. Defaults to last 30 days. All USDC amounts are human-readable strings (e.g. '1500.00' = $1,500). Volume = gross USDC including fees.",
    getStatsSchema.shape,
    (input) => getStats(flipClient, input),
  );

  server.tool(
    "get_leaderboard",
    "View the public agent leaderboard. See how agents rank by volume, fees earned, markets created, resolved markets, or live markets. Filter by category (crypto, macro, politics, sports, tech). Returns rank, agent name, volume, fees, and market counts. USDC amounts are in base units (6 decimals: 1000000 = $1).",
    getLeaderboardSchema.shape,
    (input) => getLeaderboard(flipClient, input),
  );
}

// --- Start server ---

async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

  if (!port) {
    // Default: stdio mode (existing behavior, unchanged)
    const server = new McpServer({ name: "flipcoin", version: "0.1.0" });
    registerTools(server, client);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  // --- HTTP mode ---
  const app = express();
  app.use(express.json());

  // Optional auth middleware
  const requireAuth = process.env.REQUIRE_AUTH === "true";
  if (requireAuth) {
    app.use((req, res, next) => {
      // Skip auth for health check
      if (req.path === "/health") return next();
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      next();
    });
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true, mode: "http", tools: TOOL_COUNT });
  });

  // --- StreamableHTTP transport at /mcp ---
  const httpTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });
  const httpServer = new McpServer({ name: "flipcoin", version: "0.1.0" });
  registerTools(httpServer, client);
  await httpServer.connect(httpTransport);

  app.all("/mcp", async (req, res) => {
    await httpTransport.handleRequest(req, res, req.body);
  });

  // --- Legacy SSE transport at /sse + /messages ---
  const sseTransports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    sseTransports.set(transport.sessionId, transport);

    res.on("close", () => {
      sseTransports.delete(transport.sessionId);
    });

    const sseServer = new McpServer({ name: "flipcoin", version: "0.1.0" });
    registerTools(sseServer, client);
    await sseServer.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sseTransports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  app.listen(port, () => {
    console.error(`FlipCoin MCP server listening on port ${port}`);
    console.error(`  StreamableHTTP: http://localhost:${port}/mcp`);
    console.error(`  SSE (legacy):   http://localhost:${port}/sse`);
    console.error(`  Tools: ${TOOL_COUNT}`);
    if (requireAuth) {
      console.error(`  Auth: required (Bearer token)`);
    }
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
