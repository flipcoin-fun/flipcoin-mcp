/**
 * HTTP client for FlipCoin Agent API.
 * Wraps fetch with auth headers, timeouts, and error handling.
 */

const DEFAULT_BASE_URL = "https://www.flipcoin.fun/api";
const REQUEST_TIMEOUT_MS = 30_000;

export class FlipCoinClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl?: string) {
    const resolved = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    if (baseUrl) {
      const parsed = new URL(resolved);
      if (parsed.protocol !== "https:" && !resolved.includes("localhost")) {
        throw new Error(
          "FLIPCOIN_BASE_URL must use HTTPS to protect API credentials",
        );
      }
    }
    this.apiKey = apiKey;
    this.baseUrl = resolved;
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: Record<string, unknown>;
      query?: Record<string, string | number | boolean | undefined>;
    } = {},
  ): Promise<T> {
    const { method = "GET", body, query } = options;

    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(
          `FlipCoin API error ${response.status} on ${method} ${path}: ${response.statusText}`,
        );
      }
      throw new Error(
        `FlipCoin API returned invalid JSON on ${method} ${path} (HTTP ${response.status})`,
      );
    }

    if (!response.ok) {
      const errorCode =
        (data as Record<string, unknown>).errorCode ?? response.status;
      const errorMsg =
        (data as Record<string, unknown>).error ?? response.statusText;
      throw new Error(
        `FlipCoin API error ${errorCode} on ${method} ${path}: ${errorMsg}`,
      );
    }

    return data as T;
  }

  // --- Markets ---

  async listMarkets(params?: {
    status?: string;
    sort?: string;
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      markets: import("./types.js").Market[];
      pagination: { offset: number; limit: number; total: number };
    }>("/agent/markets/explore", {
      query: params as Record<string, string | number>,
    });
  }

  async getMarket(address: string) {
    return this.request<{
      market: import("./types.js").MarketDetail;
      recentTrades: import("./types.js").Trade[];
      stats: { volume24h: string; trades24h: number };
    }>(`/agent/markets/${address}`);
  }

  // --- Portfolio ---

  async getPortfolio(status?: string) {
    return this.request<{
      positions: import("./types.js").Position[];
      totals: { marketsActive: number; marketsResolved: number };
    }>("/agent/portfolio", { query: status ? { status } : undefined });
  }

  // --- Quote ---

  async getQuote(params: {
    conditionId: string;
    side: string;
    action: string;
    amount: string;
  }) {
    return this.request<import("./types.js").QuoteResponse>("/quote", {
      query: params,
    });
  }

  // --- Trading ---

  async tradeIntent(params: {
    conditionId: string;
    side: string;
    action: string;
    usdcAmount: string;
  }) {
    return this.request<import("./types.js").TradeIntentResponse>(
      "/agent/trade/intent",
      { method: "POST", body: params as unknown as Record<string, unknown> },
    );
  }

  async tradeRelay(params: { intentId: string; auto_sign: boolean }) {
    return this.request<import("./types.js").TradeRelayResponse>(
      "/agent/trade/relay",
      { method: "POST", body: params as unknown as Record<string, unknown> },
    );
  }

  // --- Market State ---

  async getMarketState(address: string) {
    return this.request<{
      success: boolean;
      market: string;
      conditionId: string;
      lmsr: {
        qYes: string;
        qNo: string;
        b: string;
        priceYesBps: number;
        priceNoBps: number;
      };
      analytics: {
        volume24h: string;
        trades24h: number;
        liquidityUsdc: string;
      };
      slippageCurve: Array<{
        amountUsdc: string;
        priceImpactBps: number;
        effectivePriceBps: number;
      }>;
    }>(`/agent/markets/${address}/state`);
  }

  // --- Feed ---

  async getFeed(params: {
    since: string;
    types?: string;
    limit?: number;
  }) {
    return this.request<{
      events: Array<{
        type: string;
        timestamp: string;
        data: Record<string, unknown>;
      }>;
      cursor: string;
      hasMore: boolean;
    }>("/agent/feed", {
      query: params as Record<string, string | number>,
    });
  }

  // --- Redeem ---

  async checkRedeem(conditionId: string) {
    return this.request<{
      conditionId: string;
      redeemable: boolean;
      resolutionStatus?: number;
      outcome?: string;
      yesShares?: string;
      noShares?: string;
      winningShares?: string;
      expectedPayout?: string;
      payoutPerShare?: string;
      marketAddr?: string;
      title?: string;
      transaction?: {
        to: string;
        data: string;
        value: string;
        gas: string;
      };
      hint?: string;
    }>("/agent/portfolio/redeem", {
      method: "POST",
      body: { conditionId },
    });
  }

  // --- Market Creation ---

  async createMarket(params: {
    title: string;
    resolutionCriteria: string;
    resolutionSource: string;
    resolutionDate?: string;
    category?: string;
    description?: string;
    liquidityTier?: string;
    initialPriceYesBps?: number;
    auto_sign?: boolean;
  }) {
    return this.request<import("./types.js").CreateMarketResponse>(
      "/agent/markets",
      {
        method: "POST",
        body: params as unknown as Record<string, unknown>,
      },
    );
  }
}
