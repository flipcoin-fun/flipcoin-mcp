#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FlipCoinClient } from "./client.js";
import { listMarketsSchema, listMarkets } from "./tools/listMarkets.js";
import { getMarketSchema, getMarket } from "./tools/getMarket.js";
import { getQuoteSchema, getQuote } from "./tools/getQuote.js";
import { tradeSchema, trade } from "./tools/trade.js";
import { createMarketSchema, createMarket } from "./tools/createMarket.js";
import { getPortfolioSchema, getPortfolio } from "./tools/getPortfolio.js";
import { getOrdersSchema, getOrders } from "./tools/getOrders.js";
import { cancelOrderSchema, cancelOrder } from "./tools/cancelOrder.js";

const apiKey = process.env.FLIPCOIN_API_KEY?.trim();
if (!apiKey) {
  console.error(
    "Error: FLIPCOIN_API_KEY environment variable is required (must not be empty)",
  );
  process.exit(1);
}

const baseUrl = process.env.FLIPCOIN_BASE_URL;
const client = new FlipCoinClient(apiKey, baseUrl);

const server = new McpServer({
  name: "flipcoin",
  version: "0.1.0",
});

// --- Tool registrations ---

server.tool(
  "list_markets",
  "Browse prediction markets on FlipCoin. Filter by status, search by title, sort by volume/trades/deadline. Returns market address, title, status, volume, prices, and pagination.",
  listMarketsSchema.shape,
  (input) => listMarkets(client, input),
);

server.tool(
  "get_market",
  "Get detailed information about a specific prediction market including current prices, recent trades, 24h stats, resolution fields, and volume breakdown by source (LMSR vs CLOB).",
  getMarketSchema.shape,
  (input) => getMarket(client, input),
);

server.tool(
  "get_quote",
  "Get a price quote for buying or selling shares in a prediction market. Returns quotes from both LMSR (AMM) and CLOB (order book) with smart routing recommendation. No wallet required.",
  getQuoteSchema.shape,
  (input) => getQuote(client, input),
);

server.tool(
  "trade",
  "Execute a trade (buy or sell) on a prediction market. Creates an intent and immediately relays it. Requires auto_sign delegation setup. Amount is in USDC base units (6 decimals: 1000000 = $1).",
  tradeSchema.shape,
  (input) => trade(client, input),
);

server.tool(
  "create_market",
  "Create a new prediction market on FlipCoin. Requires title, resolution criteria, and resolution source URL. Optionally set category, liquidity tier, initial price. Requires auto_sign delegation for autonomous operation.",
  createMarketSchema.shape,
  (input) => createMarket(client, input),
);

server.tool(
  "get_portfolio",
  "View the agent owner's portfolio: positions across all markets with shares, current value, P&L, and entry prices. Filter by market status (open/resolved/all).",
  getPortfolioSchema.shape,
  (input) => getPortfolio(client, input),
);

server.tool(
  "get_orders",
  "List your CLOB (order book) orders. Filter by market conditionId, status, or side. Status 'open' includes partially_filled orders still active on the book. Returns orderHash, side, priceBps (price in basis points), totalShares, filledShares, filledPercent, and timestamps. Use orderHash from the response to cancel specific orders.",
  getOrdersSchema.shape,
  (input) => getOrders(client, input),
);

server.tool(
  "cancel_order",
  "Cancel a CLOB order. Pass orderHash to cancel a specific order, or set cancelAll: true to cancel ALL open orders at once via on-chain nonce bump (affects all markets, irreversible). Mass cancel is a single transaction — efficient but cancels everything. Returns transaction hash for confirmation.",
  cancelOrderSchema.shape,
  (input) => cancelOrder(client, input),
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
