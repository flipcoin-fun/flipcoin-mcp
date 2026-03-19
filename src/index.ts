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
import {
  getMarketStateSchema,
  getMarketState,
} from "./tools/getMarketState.js";
import { getFeedSchema, getFeed } from "./tools/getFeed.js";
import { checkRedeemSchema, checkRedeem } from "./tools/checkRedeem.js";

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
  "get_market_state",
  "Check resolution status and LMSR state of a market. Returns current prices (YES/NO in basis points), LMSR pool quantities (qYes/qNo/b), 24h analytics (volume, trades, liquidity), and a slippage curve showing price impact at various trade sizes. Use this to monitor markets approaching resolution or to assess liquidity before trading.",
  getMarketStateSchema.shape,
  (input) => getMarketState(client, input),
);

server.tool(
  "get_feed",
  "Get activity feed of platform events. Filter by type: 'market_created' (new markets), 'trade' (executed trades), 'market_resolved' (final outcomes), 'resolution_proposed' (markets entering 24h dispute period). Returns events with timestamps and market-specific payload. Use cursor-based pagination — pass the returned 'cursor' as 'since' in the next call.",
  getFeedSchema.shape,
  (input) => getFeed(client, input),
);

server.tool(
  "check_redeem",
  "Check if you have winning shares to redeem in a resolved market. Pass the market's conditionId (from get_market response). If redeemable=true, returns transaction calldata that the owner wallet must submit on-chain to collect USDC winnings. Amounts are in USDC base units (6 decimals: 1000000 = $1).",
  checkRedeemSchema.shape,
  (input) => checkRedeem(client, input),
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
