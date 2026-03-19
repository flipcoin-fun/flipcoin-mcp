import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const cancelOrderSchema = z.object({
  orderHash: z
    .string()
    .optional()
    .describe(
      "Hash of the specific order to cancel (0x + 64 hex chars). Get this from get_orders response. Required unless cancelAll is true.",
    ),
  cancelAll: z
    .boolean()
    .optional()
    .describe(
      "Set to true to cancel ALL open orders at once via nonce bump. Affects all markets, irreversible. When true, orderHash is ignored.",
    ),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export async function cancelOrder(
  client: FlipCoinClient,
  input: CancelOrderInput,
) {
  if (!input.orderHash && !input.cancelAll) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: either orderHash or cancelAll: true must be provided.",
        },
      ],
      isError: true,
    };
  }

  return withErrorHandling(async () => {
    const result = await client.cancelOrder(input.orderHash, input.cancelAll);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
