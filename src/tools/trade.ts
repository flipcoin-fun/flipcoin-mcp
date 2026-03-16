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
    .describe("Amount in USDC base units (6 decimals, e.g. '1000000' = $1)"),
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
