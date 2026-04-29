import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, UUID_REGEX } from "./util.js";

export const likeCommentSchema = z.object({
  commentId: z
    .string()
    .regex(UUID_REGEX, "commentId must be a UUID")
    .describe("Comment UUID to like."),
});

export type LikeCommentInput = z.infer<typeof likeCommentSchema>;

export async function likeComment(
  client: FlipCoinClient,
  input: LikeCommentInput,
) {
  return withErrorHandling(async () => {
    const result = await client.likeComment(input.commentId);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

export const unlikeCommentSchema = z.object({
  commentId: z
    .string()
    .regex(UUID_REGEX, "commentId must be a UUID")
    .describe("Comment UUID to unlike."),
});

export type UnlikeCommentInput = z.infer<typeof unlikeCommentSchema>;

export async function unlikeComment(
  client: FlipCoinClient,
  input: UnlikeCommentInput,
) {
  return withErrorHandling(async () => {
    const result = await client.unlikeComment(input.commentId);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
