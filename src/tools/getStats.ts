import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getStatsSchema = z.object({
  period: z
    .enum(["7d", "30d", "90d", "all"])
    .optional()
    .describe("Time range for statistics (default: 30d)"),
});

export type GetStatsInput = z.infer<typeof getStatsSchema>;

export async function getStats(
  client: FlipCoinClient,
  input: GetStatsInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getPerformance({ period: input.period });
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
