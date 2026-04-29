import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { BYTES32_REGEX } from "./util.js";

export const tradeSchema = z.object({
  conditionId: z
    .string()
    .regex(BYTES32_REGEX, "Must be a bytes32 hex string (0x + 64 hex chars)")
    .describe("Market condition ID (0x...)"),
  side: z.enum(["yes", "no"]).describe("Trade side"),
  action: z.enum(["buy", "sell"]).describe("Trade action"),
  usdcAmount: z
    .string()
    .optional()
    .describe(
      "USDC amount in base units (6 decimals, e.g. '1000000' = $1). Use for BUY trades. Mutually exclusive with sharesAmount.",
    ),
  sharesAmount: z
    .string()
    .optional()
    .describe(
      "Shares amount in base units (6 decimals). Use for SELL trades — how many shares to redeem. Mutually exclusive with usdcAmount.",
    ),
  venue: z
    .enum(["auto", "lmsr", "clob"])
    .optional()
    .default("auto")
    .describe(
      "Execution venue routing: 'auto' (smart-routed), 'lmsr' (force AMM), or 'clob' (force order book).",
    ),
  maxSlippageBps: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe("Maximum acceptable slippage in basis points (e.g. 500 = 5%)."),
  maxFeeBps: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe("Maximum acceptable fee in basis points."),
  // Per-trade reasoning (auto-attached to fill, surfaces on agent profile)
  confidenceBps: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe(
      "Agent's confidence in this trade in basis points (0-10000, e.g. 7500 = 75%).",
    ),
  reasoning: z
    .string()
    .max(1500)
    .optional()
    .describe(
      "Free-form reasoning for this trade (max 1500 chars). Auto-attached to the on-chain fill.",
    ),
  dataSources: z
    .array(z.string().max(500))
    .max(10)
    .optional()
    .describe(
      "Data sources/citations backing the trade (max 10 items, each ≤ 500 chars).",
    ),
  modelUsed: z
    .string()
    .max(100)
    .optional()
    .describe("Identifier for the model that produced the decision (max 100 chars)."),
  auto_sign: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-sign with session key (requires delegation setup)"),
});

export type TradeInput = z.infer<typeof tradeSchema>;

export async function trade(client: FlipCoinClient, input: TradeInput) {
  // Step 1: Create intent
  let intent;
  try {
    intent = await client.tradeIntent({
      conditionId: input.conditionId,
      side: input.side,
      action: input.action,
      usdcAmount: input.usdcAmount,
      sharesAmount: input.sharesAmount,
      venue: input.venue,
      maxSlippageBps: input.maxSlippageBps,
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
          text: `Trade intent failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }

  // Step 2: Relay immediately (intent expires in 15 seconds)
  let relay;
  try {
    relay = await client.tradeRelay({
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
              error: `Relay failed after intent was created. The intent will expire in ~15 seconds. No funds were moved.`,
              relayError:
                error instanceof Error ? error.message : String(error),
              intentId: intent.intentId,
              intentDetails: {
                conditionId: intent.conditionId,
                side: intent.side,
                action: intent.action,
                expiresAt: intent.expiresAt,
              },
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
        text: JSON.stringify(
          {
            success: relay.success,
            txHash: relay.txHash,
            marketAddr: relay.marketAddr,
            side: relay.side,
            action: relay.action,
            amountUsdc: relay.amountUsdc,
            sharesOut: relay.sharesOut,
            intent: {
              intentId: intent.intentId,
              priceYesBps: intent.priceYesBps,
              newPriceYesBps: intent.newPriceYesBps,
              fee: intent.fee,
            },
          },
          null,
          2,
        ),
      },
    ],
  };
}
