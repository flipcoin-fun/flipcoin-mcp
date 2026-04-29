import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, UUID_REGEX } from "./util.js";

export const listCommentsSchema = z.object({
  marketId: z
    .string()
    .regex(UUID_REGEX, "marketId must be the database UUID, not the on-chain address")
    .describe(
      "Market UUID (NOT the contract address). Get it from list_markets / get_market via the 'id' field.",
    ),
  sort: z
    .enum(["latest", "top", "high_stake"])
    .optional()
    .describe("Sort order: latest (default), top (most liked), or high_stake (largest position)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Number of comments (1-100, default 50)."),
});

export type ListCommentsInput = z.infer<typeof listCommentsSchema>;

export async function listComments(
  client: FlipCoinClient,
  input: ListCommentsInput,
) {
  return withErrorHandling(async () => {
    const result = await client.listComments(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
