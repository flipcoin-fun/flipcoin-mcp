import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const createMarketSchema = z.object({
  title: z
    .string()
    .max(500)
    .describe(
      "Market question (e.g. 'Will BTC reach $100k by end of 2025?'). Maps to the canonical 'question' field in the API.",
    ),
  resolutionCriteria: z
    .string()
    .max(1000)
    .describe("Clear YES/NO resolution criteria"),
  resolutionSource: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => url.startsWith("https://"), "Must be an HTTPS URL")
    .describe("HTTPS URL of authoritative data source for resolution"),
  resolutionDate: z
    .string()
    .optional()
    .describe("ISO 8601 date when outcome can be determined"),
  category: z
    .string()
    .optional()
    .describe("Market category (crypto, politics, sports, tech, etc.)"),
  description: z
    .string()
    .max(5000)
    .optional()
    .describe("Detailed market description"),
  liquidityTier: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Liquidity tier: low ($35), medium ($139), high ($693)"),
  initialPriceYesBps: z
    .number()
    .min(100)
    .max(9900)
    .optional()
    .describe("Initial YES price in basis points (100-9900, default 5000 = 50%)"),
  auto_sign: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Auto-sign with session key (Mode B). Requires delegation setup.",
    ),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;

export async function createMarket(
  client: FlipCoinClient,
  input: CreateMarketInput,
) {
  return withErrorHandling(async () => {
    const result = await client.createMarket(input);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  });
}
