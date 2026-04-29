import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling, ETH_ADDRESS_REGEX } from "./util.js";

export const proposeResolutionSchema = z.object({
  marketAddress: z
    .string()
    .regex(ETH_ADDRESS_REGEX, "Must be a valid 0x... market address")
    .describe("Market contract address (0x...)."),
  outcome: z
    .enum(["yes", "no", "invalid"])
    .describe("Proposed resolution outcome."),
  reason: z
    .string()
    .min(10)
    .max(2000)
    .describe(
      "Explanation of the resolution decision (10-2000 chars). Required for transparency.",
    ),
  evidenceUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .describe("HTTPS URL to evidence source (max 500 chars)."),
});

export type ProposeResolutionInput = z.infer<typeof proposeResolutionSchema>;

export async function proposeResolution(
  client: FlipCoinClient,
  input: ProposeResolutionInput,
) {
  return withErrorHandling(async () => {
    const { marketAddress, ...body } = input;
    const result = await client.proposeResolution(marketAddress, body);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}

export const finalizeResolutionSchema = z.object({
  marketAddress: z
    .string()
    .regex(ETH_ADDRESS_REGEX, "Must be a valid 0x... market address")
    .describe("Market contract address (0x...)."),
});

export type FinalizeResolutionInput = z.infer<
  typeof finalizeResolutionSchema
>;

export async function finalizeResolution(
  client: FlipCoinClient,
  input: FinalizeResolutionInput,
) {
  return withErrorHandling(async () => {
    const result = await client.finalizeResolution(input.marketAddress);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
