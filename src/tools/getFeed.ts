import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getFeedSchema = z.object({
  since: z
    .string()
    .optional()
    .describe(
      "Return events after this ISO 8601 timestamp (e.g. '2026-01-01T00:00:00Z'). Omit to default to the last hour. For pagination, pass the 'cursor' from the previous response.",
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

const DEFAULT_SINCE_WINDOW_MS = 60 * 60 * 1000; // 1h

export async function getFeed(
  client: FlipCoinClient,
  input: GetFeedInput,
) {
  return withErrorHandling(async () => {
    const since =
      input.since ?? new Date(Date.now() - DEFAULT_SINCE_WINDOW_MS).toISOString();
    const result = await client.getFeed({ ...input, since });
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
