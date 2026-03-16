import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const listMarketsSchema = z.object({
  status: z
    .enum(["open", "resolved", "pending", "all"])
    .optional()
    .describe("Filter by market status"),
  sort: z
    .enum(["volume", "created", "trades", "deadlineSoon"])
    .optional()
    .describe("Sort order"),
  search: z.string().optional().describe("Search markets by title"),
  category: z
    .string()
    .optional()
    .describe("Filter by category (e.g. crypto, politics, sports)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1-100, default 50)"),
  offset: z.number().min(0).optional().describe("Pagination offset"),
});

export type ListMarketsInput = z.infer<typeof listMarketsSchema>;

export async function listMarkets(
  client: FlipCoinClient,
  input: ListMarketsInput,
) {
  return withErrorHandling(async () => {
    const result = await client.listMarkets(input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  });
}
