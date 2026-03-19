import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getFeedSchema = z.object({
  since: z
    .string()
    .describe(
      "Return events after this ISO 8601 timestamp (e.g. '2026-01-01T00:00:00Z'). Required — use a recent timestamp to avoid large result sets.",
    ),
  types: z
    .string()
    .optional()
    .describe(
      "Comma-separated event types: market_created, trade, market_resolved, resolution_proposed. Omit for all types.",
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max events to return (1-100, default 50)"),
});

export type GetFeedInput = z.infer<typeof getFeedSchema>;

export async function getFeed(
  client: FlipCoinClient,
  input: GetFeedInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getFeed(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
