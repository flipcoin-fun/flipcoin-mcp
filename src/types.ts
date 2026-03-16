// FlipCoin API response types

export interface Market {
  id: string;
  marketAddr: string;
  conditionId: string | null;
  title: string;
  description: string | null;
  status: "open" | "pending" | "resolved" | "expired";
  volumeUsdc: number;
  liquidityUsdc: number;
  tradesCount: number;
  createdAt: string;
  resolveEndAt: string | null;
  resolvedOutcome: string | null;
  creatorAddr: string;
  fingerprint: string;
}

export interface MarketDetail extends Market {
  imageUrl: string | null;
  updatedAt: string;
  lastActivityAt: string | null;
  resolveStartAt: string | null;
  resolvedAt: string | null;
  currentPriceYesBps: number;
  currentPriceNoBps: number;
  volumeBySource: {
    backstop: string;
    clob: string;
  };
  agentMetadata: { reasoning: string; confidence: number } | null;
}

export interface Trade {
  trader: string;
  side: "yes" | "no";
  amountUsdc: number;
  shares: number;
  fee: number;
  priceYesBps: number;
  txHash: string;
  blockNumber: number;
  eventTime: string;
}

export interface Position {
  marketAddr: string;
  title: string;
  status: string;
  yesShares: number;
  noShares: number;
  netSide: "yes" | "no";
  netShares: number;
  avgEntryPriceUsdc: number;
  currentPriceBps: number;
  currentValueUsdc: number;
  pnlUsdc: number;
  lastTradeAt: string;
}

export interface QuoteResponse {
  conditionId: string;
  side: string;
  action: string;
  amount: string;
  venue: string;
  reason: string;
  mayPartialFill: boolean;
  validUntil: string;
  lmsr: {
    available: boolean;
    sharesOut: string;
    fee: string;
    priceYesBps: number;
    newPriceYesBps: number;
    priceImpactBps: number;
    avgPriceBps: number;
  } | null;
  clob: {
    available: boolean;
    canFillFull: boolean;
    sharesOut: string;
    avgPriceBps: number;
    bestBidBps: number;
    bestAskBps: number;
    spreadBps: number;
  } | null;
}

export interface TradeIntentResponse {
  intentId: string;
  conditionId: string;
  side: string;
  action: string;
  usdcAmount: string;
  sharesOut: string;
  fee: string;
  priceYesBps: number;
  newPriceYesBps: number;
  expiresAt: string;
  typedData?: Record<string, unknown>;
}

export interface TradeRelayResponse {
  success: boolean;
  txHash: string;
  marketAddr: string;
  side: string;
  action: string;
  amountUsdc: string;
  sharesOut: string;
}

export interface CreateMarketResponse {
  success: boolean;
  status: string;
  requestId: string;
  marketAddr?: string;
  txHash?: string;
  typedData?: Record<string, unknown>;
}
