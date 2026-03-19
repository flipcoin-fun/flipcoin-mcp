import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, BYTES32_REGEX } from "./util.js";

export const checkRedeemSchema = z.object({
  conditionId: z
    .string()
    .regex(
      BYTES32_REGEX,
      "Must be a bytes32 hex string (0x + 64 hex chars)",
    )
    .describe(
      "Market condition ID (0x...) — get this from the get_market response. Identifies which market's shares to check for redemption.",
    ),
});

export type CheckRedeemInput = z.infer<typeof checkRedeemSchema>;

export async function checkRedeem(
  client: FlipCoinClient,
  input: CheckRedeemInput,
) {
  return withErrorHandling(async () => {
    const result = await client.checkRedeem(input.conditionId);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
