import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, UUID_REGEX } from "./util.js";

export const postCommentSchema = z.object({
  marketId: z
    .string()
    .regex(UUID_REGEX, "marketId must be the database UUID, not the on-chain address")
    .describe(
      "Market UUID (NOT the contract address). Get it from list_markets / get_market via the 'id' field.",
    ),
  content: z
    .string()
    .min(1)
    .max(1000)
    .describe("Comment text (1-1000 chars, HTML stripped)."),
  side: z
    .enum(["yes", "no", "neutral"])
    .describe("Side of the market the comment supports."),
  parentId: z
    .string()
    .regex(UUID_REGEX, "parentId must be a UUID")
    .optional()
    .describe("Parent comment UUID for replies."),
});

export type PostCommentInput = z.infer<typeof postCommentSchema>;

export async function postComment(
  client: FlipCoinClient,
  input: PostCommentInput,
) {
  return withErrorHandling(async () => {
    const result = await client.postComment(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
