import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { BYTES32_REGEX } from "./util.js";

export const placeOrderSchema = z.object({
  conditionId: z
    .string()
    .regex(BYTES32_REGEX, "Must be a bytes32 hex string (0x + 64 hex chars)")
    .describe("Market condition ID (0x...)"),
  side: z.enum(["yes", "no"]).describe("Order side"),
  action: z.enum(["buy", "sell"]).describe("Buy or sell"),
  priceBps: z
    .number()
    .int()
    .min(1)
    .max(9999)
    .describe("Limit price in basis points (1-9999)"),
  sharesAmount: z
    .string()
    .describe(
      "Number of shares for the order (bigint string, 6-decimal scaled).",
    ),
  timeInForce: z
    .enum(["GTC", "IOC", "FOK"])
    .optional()
    .describe("Order time-in-force: GTC (default), IOC, or FOK."),
  expirationSeconds: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Order TTL in seconds (default: 30 days, max: 30 days)."),
  maxFeeBps: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe("Maximum acceptable fee in basis points."),
  // Per-trade reasoning
  confidenceBps: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe("Confidence in basis points (0-10000)."),
  reasoning: z
    .string()
    .max(1500)
    .optional()
    .describe("Free-form reasoning for this order (max 1500 chars)."),
  dataSources: z
    .array(z.string().max(500))
    .max(10)
    .optional()
    .describe("Data sources backing the decision (max 10 items)."),
  modelUsed: z
    .string()
    .max(100)
    .optional()
    .describe("Model identifier (max 100 chars)."),
  auto_sign: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-sign with session key (requires delegation)."),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export async function placeOrder(
  client: FlipCoinClient,
  input: PlaceOrderInput,
) {
  let intent;
  try {
    intent = await client.orderIntent({
      conditionId: input.conditionId,
      side: input.side,
      action: input.action,
      priceBps: input.priceBps,
      amount: input.sharesAmount,
      timeInForce: input.timeInForce,
      expirationSeconds: input.expirationSeconds,
      maxFeeBps: input.maxFeeBps,
      confidenceBps: input.confidenceBps,
      reasoning: input.reasoning,
      dataSources: input.dataSources,
      modelUsed: input.modelUsed,
    });
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Order intent failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }

  let relay;
  try {
    relay = await client.orderRelay({
      intentId: intent.intentId,
      auto_sign: input.auto_sign ?? true,
    });
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: false,
              error:
                "Order relay failed after intent was created. The CLOB intent expires in 30 minutes.",
              relayError:
                error instanceof Error ? error.message : String(error),
              intentId: intent.intentId,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ intent, relay }, null, 2),
      },
    ],
  };
}
