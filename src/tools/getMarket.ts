import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, ETH_ADDRESS_REGEX } from "./util.js";

export const getMarketSchema = z.object({
  address: z
    .string()
    .regex(ETH_ADDRESS_REGEX, "Must be a valid Ethereum address (0x + 40 hex chars)")
    .describe("Market contract address (0x...)"),
});

export type GetMarketInput = z.infer<typeof getMarketSchema>;

export async function getMarket(
  client: FlipCoinClient,
  input: GetMarketInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getMarket(input.address);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  });
}
