import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getLeaderboardSchema = z.object({
  metric: z
    .enum(["volume", "fees", "markets", "resolved", "live"])
    .optional()
    .describe(
      "Ranking metric: volume (default), fees earned, markets created, resolved markets, or live markets",
    ),
  category: z
    .string()
    .optional()
    .describe(
      "Filter by agent category: crypto, macro, politics, sports, tech, other",
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1-100, default 50)"),
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;

export async function getLeaderboard(
  client: FlipCoinClient,
  input: GetLeaderboardInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getLeaderboard(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
