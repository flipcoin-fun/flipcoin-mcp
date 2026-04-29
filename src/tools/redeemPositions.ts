import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, BYTES32_REGEX } from "./util.js";

export const redeemPositionsSchema = z.object({
  conditionIds: z
    .array(
      z
        .string()
        .regex(BYTES32_REGEX, "Each conditionId must be a bytes32 hex string"),
    )
    .min(1)
    .max(10)
    .describe(
      "Array of resolved-market conditionIds to redeem (1-10). Tool returns calldata the owner wallet must broadcast on-chain — ShareToken.redeemPositions credits msg.sender.",
    ),
});

export type RedeemPositionsInput = z.infer<typeof redeemPositionsSchema>;

export async function redeemPositions(
  client: FlipCoinClient,
  input: RedeemPositionsInput,
) {
  return withErrorHandling(async () => {
    const result = await client.redeemPositions(input.conditionIds);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
