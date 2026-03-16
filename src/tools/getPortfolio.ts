import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getPortfolioSchema = z.object({
  status: z
    .enum(["open", "resolved", "all"])
    .optional()
    .describe("Filter positions by market status"),
});

export type GetPortfolioInput = z.infer<typeof getPortfolioSchema>;

export async function getPortfolio(
  client: FlipCoinClient,
  input: GetPortfolioInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getPortfolio(input.status);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  });
}
