import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, BYTES32_REGEX } from "./util.js";

export const getQuoteSchema = z.object({
  conditionId: z
    .string()
    .regex(BYTES32_REGEX, "Must be a bytes32 hex string (0x + 64 hex chars)")
    .describe("Market condition ID (0x...)"),
  side: z.enum(["yes", "no"]).describe("Trade side"),
  action: z.enum(["buy", "sell"]).describe("Trade action"),
  amount: z
    .string()
    .describe("Amount in USDC base units (6 decimals, e.g. '10000000' = $10)"),
});

export type GetQuoteInput = z.infer<typeof getQuoteSchema>;

export async function getQuote(
  client: FlipCoinClient,
  input: GetQuoteInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getQuote(input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  });
}
