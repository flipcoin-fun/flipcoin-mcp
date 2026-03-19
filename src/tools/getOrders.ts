import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getOrdersSchema = z.object({
  conditionId: z
    .string()
    .optional()
    .describe(
      "Filter orders by market condition ID (0x + 64 hex chars). Get this from the get_market response. Omit to see orders across all markets.",
    ),
  status: z
    .enum(["open", "partially_filled", "filled", "cancelled", "all"])
    .optional()
    .describe(
      "Filter by order status. 'open' includes partially_filled orders still active on the book. Default shows all.",
    ),
  side: z
    .enum(["yes", "no"])
    .optional()
    .describe("Filter by trade side"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1-100, default 50)"),
  offset: z
    .number()
    .min(0)
    .optional()
    .describe("Pagination offset"),
});

export type GetOrdersInput = z.infer<typeof getOrdersSchema>;

export async function getOrders(
  client: FlipCoinClient,
  input: GetOrdersInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getOrders(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
