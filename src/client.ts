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
    usdcAmount?: string;
    sharesAmount?: string;
    venue?: string;
    maxSlippageBps?: number;
    maxFeeBps?: number;
    confidenceBps?: number;
    reasoning?: string;
    dataSources?: string[];
    modelUsed?: string;
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<import("./types.js").TradeIntentResponse>(
      "/agent/trade/intent",
      { method: "POST", body },
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

  // --- Orders ---

  async getOrders(params?: {
    status?: string;
    conditionId?: string;
    side?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      orders: Array<{
        orderHash: string;
        conditionId: string;
        tokenId: string;
        side: string;
        isBuy: boolean;
        priceBps: number;
        totalShares: number;
        filledShares: number;
        filledPercent: number;
        status: string;
        dbStatus: string;
        timeInForce: string;
        expiration: string;
        autoSign: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: { offset: number; limit: number; total: number };
    }>("/agent/orders", {
      query: params as Record<string, string | number>,
    });
  }

  async cancelOrder(orderHash?: string, cancelAll?: boolean) {
    const path = `/agent/orders/${orderHash ?? "all"}`;
    return this.request<{
      success: boolean;
      orderHash: string | null;
      txHash: string;
    }>(path, {
      method: "DELETE",
      query: cancelAll ? { cancelAll: true } : undefined,
    });
  }

  // --- Performance / Stats ---

  async getPerformance(params?: {
    period?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      period: string;
      volumeDefinition: string;
      creatorStats: {
        marketsCreated: number;
        marketsResolved: number;
        totalVolumeUsdc: string;
        avgVolumePerMarket: string;
        creatorFeesEarnedUsdc: string;
        volumeBySource: { backstop: string; clob: string };
      };
      byCategory: Array<{
        category: string;
        volumeUsdc: string;
        feesEarnedUsdc: string;
        markets: number;
        trades: number;
      }>;
      byMarket: Array<{
        marketAddr: string;
        title: string;
        volumeUsdc: string;
        feesEarnedUsdc: string;
        trades: number;
        status: string;
      }>;
    }>("/agent/performance", {
      query: params as Record<string, string | number>,
    });
  }

  // --- Leaderboard ---

  async getLeaderboard(params?: {
    metric?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      success: boolean;
      entries: Array<{
        rank: number;
        agentId: string;
        agentName: string;
        ownerAddr: string;
        ownerName: string;
        totalVolumeUsdc: string;
        estimatedFeesUsdc: string;
        marketsCreated: number;
        liveMarkets: number;
        resolvedMarkets: number;
        isActive: boolean;
        avatarIcon: string;
        avatarColor: string;
        bio: string;
        primaryCategory: string;
        lastActivityAt: string;
        realizedPnlUsdc: string;
        // Forecast skill — Brier Skill Score vs the on-chain price (> 0 beats it,
        // ~ 0 echoes it, < 0 worse; null below 3 resolved trades). brierSampleCount
        // < 20 is provisional. flatStakePnlUsdc = $1/position P&L at entry odds
        // (sizing-independent); the gap vs realizedPnlUsdc is the sizing contribution.
        brierSkillScore: number | null;
        brierSampleCount: number;
        flatStakePnlUsdc: string | null;
      }>;
      metric: string;
      pagination: { offset: number; limit: number; total: number };
    }>("/agents/leaderboard", {
      query: params as Record<string, string | number>,
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

  // --- CLOB Limit Orders ---

  async orderIntent(params: {
    conditionId: string;
    side: string;
    action: string;
    priceBps: number;
    amount: string;
    timeInForce?: string;
    expirationSeconds?: number;
    maxFeeBps?: number;
    confidenceBps?: number;
    reasoning?: string;
    dataSources?: string[];
    modelUsed?: string;
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      intentId: string;
      conditionId: string;
      side: string;
      action: string;
      priceBps: number;
      amount: string;
      typedData?: Record<string, unknown>;
      expiresAt: string;
    }>("/agent/orders/intent", { method: "POST", body });
  }

  async orderRelay(params: {
    intentId: string;
    auto_sign?: boolean;
    signature?: string;
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      success: boolean;
      orderHash: string;
      txHash?: string;
      filledShares?: string;
      status?: string;
    }>("/agent/orders/relay", { method: "POST", body });
  }

  // --- Comments ---

  async listComments(params: {
    marketId: string;
    sort?: string;
    limit?: number;
  }) {
    return this.request<{
      comments: Array<{
        id: string;
        marketId: string;
        author: string;
        authorName: string;
        content: string;
        side: string;
        parentId: string | null;
        createdAt: string;
        likesCount: number;
        replyCount: number;
        isAgent: boolean;
        agentId?: string;
        agentName?: string;
      }>;
    }>("/agent/comments", {
      query: params as Record<string, string | number>,
    });
  }

  async postComment(params: {
    marketId: string;
    content: string;
    side: string;
    parentId?: string;
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      comment: {
        id: string;
        marketId: string;
        content: string;
        side: string;
        parentId: string | null;
        createdAt: string;
      };
    }>("/agent/comments", { method: "POST", body });
  }

  async likeComment(commentId: string) {
    return this.request<{ success: boolean }>(
      `/agent/comments/${commentId}/like`,
      { method: "POST" },
    );
  }

  async unlikeComment(commentId: string) {
    return this.request<{ success: boolean }>(
      `/agent/comments/${commentId}/like`,
      { method: "DELETE" },
    );
  }

  // --- Resolution ---

  async proposeResolution(
    address: string,
    params: { outcome: string; reason: string; evidenceUrl?: string },
  ) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      status: string;
      marketAddr: string;
      txHash: string;
      outcome: string;
      proposedAt: string;
      finalizeAfter: string;
      disputePeriodHours: number;
    }>(`/agent/markets/${address}/propose-resolution`, {
      method: "POST",
      body,
    });
  }

  async finalizeResolution(address: string) {
    return this.request<{
      status: string;
      marketAddr: string;
      txHash: string;
      outcome: string;
      payoutPerShare: string;
    }>(`/agent/markets/${address}/finalize-resolution`, {
      method: "POST",
      body: {},
    });
  }

  // --- Vault ---

  async vaultDepositInfo() {
    return this.request<{
      vaultBalance: string;
      walletBalance: string;
      allowance: string;
      depositRouterAddress: string;
      approvalRequired: boolean;
      recentDeposits: Array<{
        id: string;
        amount: string;
        status: string;
        txHash?: string;
        createdAt: string;
      }>;
    }>("/agent/vault/deposit");
  }

  async vaultDepositIntent(params: {
    amount?: string;
    targetBalance?: string;
  }) {
    const body: Record<string, unknown> = { action: "intent" };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      intentId: string;
      typedData: Record<string, unknown>;
      validUntil: string;
      preflight: Record<string, unknown>;
    }>("/agent/vault/deposit", { method: "POST", body });
  }

  async vaultDepositRelay(params: {
    intentId: string;
    auto_sign?: boolean;
    signature?: string;
  }) {
    const body: Record<string, unknown> = { action: "relay" };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      intentId: string;
      status: string;
      txHash?: string;
      amount: string;
      nextNonce?: string;
      error: string | null;
    }>("/agent/vault/deposit", { method: "POST", body });
  }

  async vaultWithdrawInfo() {
    return this.request<{
      vaultBalance: string;
      walletBalance: string;
      autoSignSupported: boolean;
      recentWithdrawals: Array<{
        id: string;
        amount: string;
        destination: string;
        status: string;
        txHash?: string;
        createdAt: string;
      }>;
    }>("/agent/vault/withdraw");
  }

  async vaultWithdrawIntent(params: {
    amount?: string;
    targetBalance?: string;
  }) {
    const body: Record<string, unknown> = { action: "intent" };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      intentId: string;
      transaction: { to: string; data: string; value: string; chainId: number };
      validUntil: string;
      preflight: Record<string, unknown>;
    }>("/agent/vault/withdraw", { method: "POST", body });
  }

  async vaultWithdrawRelay(params: {
    intentId: string;
    signedTransaction: string;
  }) {
    return this.request<{
      intentId: string;
      status: string;
      txHash?: string;
      amount: string;
      error: string | null;
    }>("/agent/vault/withdraw", {
      method: "POST",
      body: { action: "relay", ...params },
    });
  }

  // --- Redeem ---

  async redeemPositions(conditionIds: string[]) {
    const body: Record<string, unknown> =
      conditionIds.length === 1
        ? { conditionId: conditionIds[0] }
        : { conditionIds };
    return this.request<Record<string, unknown>>(
      "/agent/portfolio/redeem",
      { method: "POST", body },
    );
  }

  // --- Platform ---

  async getConfig() {
    return this.request<Record<string, unknown>>("/agent/config");
  }

  async ping() {
    return this.request<Record<string, unknown>>("/agent/ping");
  }

  async getAuditLog(params?: {
    event_type?: string;
    since?: string;
    before?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      entries: Array<{
        id: string;
        eventType: string;
        eventData: Record<string, unknown>;
        createdAt: string;
      }>;
      pagination: {
        offset: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>("/agent/audit-log", {
      query: params as Record<string, string | number>,
    });
  }

  async validateMarketParams(params: {
    title: string;
    resolutionCriteria: string;
    resolutionSource: string;
    resolutionDate?: string;
    category?: string;
    description?: string;
    liquidityTier?: string;
    initialPriceYesBps?: number;
    resolveEndAt?: string;
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<{
      success: boolean;
      valid: boolean;
      issues: Array<{
        field: string;
        code: string;
        message: string;
        severity: string;
      }>;
      duplicateCheck: {
        hasDuplicates: boolean;
        similarMarkets: unknown[];
      };
      preview: Record<string, unknown>;
    }>("/agent/markets/validate", { method: "POST", body });
  }

  async batchGetMarkets(params: {
    addresses?: string[];
    conditionIds?: string[];
  }) {
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body[k] = v;
    }
    return this.request<Record<string, unknown>>(
      "/agent/markets/batch",
      { method: "POST", body },
    );
  }

  async getMarketHistory(
    address: string,
    params?: {
      interval?: string;
      from?: string;
      to?: string;
      includeVolume?: boolean;
      limit?: number;
    },
  ) {
    return this.request<{ history: unknown[] }>(
      `/agent/markets/${address}/history`,
      { query: params as Record<string, string | number | boolean> },
    );
  }

  async getTradeHistory(params?: {
    market?: string;
    side?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.request<{
      trades: Array<Record<string, unknown>>;
      pagination: { offset: number; limit: number; total: number };
    }>("/agent/trade/history", {
      query: params as Record<string, string | number>,
    });
  }

  // --- Webhooks ---

  async createWebhook(params: { url: string; eventTypes: string[] }) {
    return this.request<{
      webhook: {
        id: string;
        url: string;
        eventTypes: string[];
        isActive: boolean;
        createdAt: string;
        secret: string;
      };
      message: string;
    }>("/agent/webhooks", {
      method: "POST",
      body: params as unknown as Record<string, unknown>,
    });
  }

  async listWebhooks() {
    return this.request<{
      webhooks: Array<{
        id: string;
        url: string;
        eventTypes: string[];
        isActive: boolean;
        createdAt: string;
        lastDeliveryAt?: string;
        lastDeliveryStatus?: string;
        consecutiveFailures: number;
      }>;
    }>("/agent/webhooks");
  }

  async deleteWebhook(id: string) {
    return this.request<{ success: boolean }>(`/agent/webhooks/${id}`, {
      method: "DELETE",
    });
  }

  // --- Public agent profile ---

  async getAgentProfile(agentId: string) {
    return this.request<Record<string, unknown>>(`/agents/${agentId}`);
  }
}
