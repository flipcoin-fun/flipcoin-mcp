# FlipCoin MCP Server

MCP server for [FlipCoin](https://www.flipcoin.fun) prediction markets. Connect Claude to FlipCoin and let it browse markets, get price quotes, trade, and create markets — all through natural language.

## Quick Start (2 minutes)

### Step 1: Get an API key

1. Open [flipcoin.fun/app/agents](https://www.flipcoin.fun/app/agents)
2. Connect your wallet (MetaMask, Coinbase Wallet, or any EVM wallet)
3. Click **"Create Agent"**, give it a name (e.g. "My Claude Agent")
4. Click **"Generate API Key"**
5. Copy the key — it starts with `fc_` and is shown **only once**

### Step 2: Add to Claude

**Claude Desktop** — open the config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add this block (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "flipcoin": {
      "command": "npx",
      "args": ["-y", "@flipcoin/mcp-server"],
      "env": {
        "FLIPCOIN_API_KEY": "fc_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. You should see "flipcoin" in the MCP servers list (hammer icon).

**Claude Code (CLI)** — add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "flipcoin": {
      "command": "npx",
      "args": ["-y", "@flipcoin/mcp-server"],
      "env": {
        "FLIPCOIN_API_KEY": "fc_your_api_key_here"
      }
    }
  }
}
```

### Step 3: Try it

Ask Claude:

> "What prediction markets are open on FlipCoin?"

That's it — `list_markets`, `get_market`, `get_quote`, and `get_portfolio` work immediately with just an API key. No wallet setup needed for reading data and getting quotes.

---

## Tools

### Works immediately (read-only, API key only)

| Tool | Description | Example prompt |
|------|-------------|---------------|
| `list_markets` | Browse and search markets | "Show me crypto prediction markets sorted by volume" |
| `get_market` | Market details: prices, trades, volume, resolution | "What's the current price on market 0xABC...?" |
| `get_quote` | Price quote with LMSR + CLOB smart routing | "How much would it cost to buy $10 of YES shares?" |
| `get_portfolio` | Your positions, P&L, holdings | "Show my FlipCoin portfolio" |

### Requires trading setup (see below)

| Tool | Description | Example prompt |
|------|-------------|---------------|
| `trade` | Buy or sell shares on a market | "Buy $5 of YES on the Bitcoin market" |
| `create_market` | Create a new prediction market | "Create a market: Will ETH reach $5000 by July?" |

---

## Trading Setup

The `trade` and `create_market` tools execute on-chain transactions. They require three one-time setup steps from your wallet:

### 1. Deposit USDC to Vault

Your wallet's USDC balance is separate from the FlipCoin Vault. You need to deposit funds:

- Go to [flipcoin.fun/app/settings](https://www.flipcoin.fun/app/settings) or the Agents page
- Click **"Add Funds"** — this handles USDC approval + deposit in one flow
- For market creation, minimum deposit depends on liquidity tier:
  - `trial`: $0 (platform-funded $50 seed)
  - `low`: $35
  - `medium`: $139
  - `high`: $693

### 2. Create a Session Key (delegation)

Session keys let the MCP server sign transactions on your behalf, with daily limits:

- Go to [flipcoin.fun/app/agents](https://www.flipcoin.fun/app/agents)
- Select your agent → **"Session Keys"** tab
- Click **"Create Session Key"** — this sends an on-chain transaction to register delegation
- Set daily USDC limits and expiration as needed

### 3. Approve Share Tokens (for selling only)

If you want to sell shares, approve the trading contracts to transfer your tokens:

- **LMSR sells**: Approve BackstopRouter
- **CLOB sells**: Approve Exchange

The API will tell you if an approval is missing — the response includes the exact contract and function to call.

### Verify your setup

Ask Claude:

> "Check my FlipCoin portfolio and tell me if I can trade"

The `get_portfolio` tool shows your positions. If trading fails, the error message will tell you exactly what's missing (vault balance, delegation, or approval).

---

## How It Works

This MCP server is a thin wrapper around the [FlipCoin Agent API](https://www.flipcoin.fun/docs/agent-api). When you ask Claude to interact with FlipCoin, it calls these tools, which make HTTP requests to the API using your API key.

```
Claude → MCP Server → FlipCoin Agent API → Base blockchain
```

**Trading flow**: The `trade` tool uses an atomic intent-relay pattern:
1. Creates a trade intent (server computes the quote, builds EIP-712 data)
2. Immediately relays it (server signs with your session key and submits to chain)
3. Returns the transaction hash and trade details

The intent expires in 15 seconds, so both steps happen in one tool call. If the relay fails after intent creation, the error includes the intent ID for debugging (the intent expires safely — no funds at risk).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FLIPCOIN_API_KEY` | Yes | Your FlipCoin agent API key (`fc_...`) |
| `FLIPCOIN_BASE_URL` | No | API base URL (default: `https://www.flipcoin.fun/api`) |

---

## Run from source

```bash
git clone https://github.com/flipcoin-fun/flipcoin-mcp.git
cd flipcoin-mcp
npm install
npm run build
export FLIPCOIN_API_KEY=fc_your_api_key_here
npm start
```

## Development

```bash
npm install
npm run dev          # Run with tsx (hot reload)
npm run build        # Compile TypeScript
npm run lint         # Type-check only
```

## License

MIT
