import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, ETH_ADDRESS_REGEX, UUID_REGEX } from "./util.js";

// --- get_config ---

export const getConfigSchema = z.object({});
export type GetConfigInput = z.infer<typeof getConfigSchema>;

export async function getConfig(client: FlipCoinClient, _input: GetConfigInput) {
  return withErrorHandling(async () => {
    const result = await client.getConfig();
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- ping ---

export const pingSchema = z.object({});
export type PingInput = z.infer<typeof pingSchema>;

export async function ping(client: FlipCoinClient, _input: PingInput) {
  return withErrorHandling(async () => {
    const result = await client.ping();
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- get_audit_log ---

export const getAuditLogSchema = z.object({
  event_type: z
    .string()
    .optional()
    .describe(
      "Comma-separated event types: key_created, market_created, rate_limit_hit, auth_failed, webhook_created, etc.",
    ),
  since: z
    .string()
    .optional()
    .describe("ISO 8601 timestamp — events after this time."),
  before: z
    .string()
    .optional()
    .describe("ISO 8601 timestamp — events before this time."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max entries (default 50, max 100)."),
  offset: z.number().int().min(0).optional().describe("Pagination offset."),
});

export type GetAuditLogInput = z.infer<typeof getAuditLogSchema>;

export async function getAuditLog(
  client: FlipCoinClient,
  input: GetAuditLogInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getAuditLog(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- validate_market_params ---

export const validateMarketParamsSchema = z.object({
  title: z.string().max(500).describe("Market question."),
  resolutionCriteria: z.string().max(1000).describe("Resolution criteria."),
  resolutionSource: z
    .string()
    .url()
    .describe("HTTPS URL of authoritative source."),
  resolutionDate: z
    .string()
    .optional()
    .describe("ISO 8601 resolution date."),
  category: z.string().optional(),
  description: z.string().max(5000).optional(),
  liquidityTier: z.enum(["trial", "low", "medium", "high"]).optional(),
  initialPriceYesBps: z.number().int().min(100).max(9900).optional(),
  resolveEndAt: z.string().optional().describe("ISO 8601 deadline."),
});

export type ValidateMarketParamsInput = z.infer<
  typeof validateMarketParamsSchema
>;

export async function validateMarketParams(
  client: FlipCoinClient,
  input: ValidateMarketParamsInput,
) {
  return withErrorHandling(async () => {
    const result = await client.validateMarketParams(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- batch_get_markets ---

export const batchGetMarketsSchema = z.object({
  addresses: z
    .array(z.string().regex(ETH_ADDRESS_REGEX))
    .max(50)
    .optional()
    .describe("Up to 50 market contract addresses."),
  conditionIds: z
    .array(z.string())
    .max(50)
    .optional()
    .describe("Up to 50 conditionIds (bytes32 hex strings)."),
});

export type BatchGetMarketsInput = z.infer<typeof batchGetMarketsSchema>;

export async function batchGetMarkets(
  client: FlipCoinClient,
  input: BatchGetMarketsInput,
) {
  if (!input.addresses?.length && !input.conditionIds?.length) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: either 'addresses' or 'conditionIds' must be provided.",
        },
      ],
      isError: true,
    };
  }
  return withErrorHandling(async () => {
    const result = await client.batchGetMarkets(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- get_market_history ---

export const getMarketHistorySchema = z.object({
  marketAddress: z
    .string()
    .regex(ETH_ADDRESS_REGEX, "Must be a valid 0x... address")
    .describe("Market contract address."),
  interval: z
    .enum(["raw", "1m", "5m", "1h", "1d"])
    .optional()
    .describe("Mode: raw (trade points) or OHLC bucket size. Default: raw."),
  from: z.string().optional().describe("ISO 8601 start time (inclusive)."),
  to: z.string().optional().describe("ISO 8601 end time (inclusive)."),
  includeVolume: z
    .boolean()
    .optional()
    .describe("Include volume data in response."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe("Number of data points (1-500, default 200)."),
});

export type GetMarketHistoryInput = z.infer<typeof getMarketHistorySchema>;

export async function getMarketHistory(
  client: FlipCoinClient,
  input: GetMarketHistoryInput,
) {
  return withErrorHandling(async () => {
    const { marketAddress, ...query } = input;
    const result = await client.getMarketHistory(marketAddress, query);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- get_trade_history ---

export const getTradeHistorySchema = z.object({
  market: z
    .string()
    .regex(ETH_ADDRESS_REGEX)
    .optional()
    .describe("Filter by market contract address."),
  side: z.enum(["yes", "no"]).optional().describe("Filter by side."),
  source: z.enum(["lmsr", "clob"]).optional().describe("Filter by venue."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max trades (default 50, max 100)."),
  offset: z.number().int().min(0).optional().describe("Pagination offset."),
});

export type GetTradeHistoryInput = z.infer<typeof getTradeHistorySchema>;

export async function getTradeHistory(
  client: FlipCoinClient,
  input: GetTradeHistoryInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getTradeHistory(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- get_performance ---

export const getPerformanceSchema = z.object({
  period: z
    .string()
    .optional()
    .describe("Time period (e.g. '7d', '30d', '90d', 'all'). Default 30d."),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type GetPerformanceInput = z.infer<typeof getPerformanceSchema>;

export async function getPerformance(
  client: FlipCoinClient,
  input: GetPerformanceInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getPerformance(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- Webhooks ---

export const createWebhookSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), "Webhook URL must use HTTPS")
    .describe("HTTPS endpoint that will receive POSTed event payloads."),
  eventTypes: z
    .array(z.string())
    .min(1)
    .max(20)
    .describe(
      "Subscribed event types: market_created, trade, trade_executed, order_filled, rate_limit_warning, etc.",
    ),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export async function createWebhook(
  client: FlipCoinClient,
  input: CreateWebhookInput,
) {
  return withErrorHandling(async () => {
    const result = await client.createWebhook(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

export const listWebhooksSchema = z.object({});
export type ListWebhooksInput = z.infer<typeof listWebhooksSchema>;

export async function listWebhooks(
  client: FlipCoinClient,
  _input: ListWebhooksInput,
) {
  return withErrorHandling(async () => {
    const result = await client.listWebhooks();
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

export const deleteWebhookSchema = z.object({
  id: z
    .string()
    .regex(UUID_REGEX, "Webhook id must be a UUID")
    .describe("Webhook UUID to delete."),
});

export type DeleteWebhookInput = z.infer<typeof deleteWebhookSchema>;

export async function deleteWebhook(
  client: FlipCoinClient,
  input: DeleteWebhookInput,
) {
  return withErrorHandling(async () => {
    const result = await client.deleteWebhook(input.id);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

// --- get_agent_profile ---

export const getAgentProfileSchema = z.object({
  agentId: z
    .string()
    .regex(UUID_REGEX, "agentId must be a UUID")
    .describe("Public agent UUID."),
});

export type GetAgentProfileInput = z.infer<typeof getAgentProfileSchema>;

export async function getAgentProfile(
  client: FlipCoinClient,
  input: GetAgentProfileInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getAgentProfile(input.agentId);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
