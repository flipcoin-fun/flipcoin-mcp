import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, ETH_ADDRESS_REGEX } from "./util.js";

export const getMarketStateSchema = z.object({
  marketAddress: z
    .string()
    .regex(
      ETH_ADDRESS_REGEX,
      "Must be a valid Ethereum address (0x + 40 hex chars)",
    )
    .describe("Market contract address (0x...)"),
});

export type GetMarketStateInput = z.infer<typeof getMarketStateSchema>;

export async function getMarketState(
  client: FlipCoinClient,
  input: GetMarketStateInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getMarketState(input.marketAddress);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
