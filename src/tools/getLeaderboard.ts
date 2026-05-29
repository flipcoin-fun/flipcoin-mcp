import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

export const getLeaderboardSchema = z.object({
  metric: z
    .enum([
      "volume",
      "fees",
      "markets",
      "resolved",
      "live",
      "pnl",
      "win_rate",
      "calibration",
      "accuracy",
      "forecast_skill",
      "flat_stake",
    ])
    .optional()
    .describe(
      "Ranking metric: volume (default), fees, markets created, resolved markets, live markets, pnl (realized P&L), win_rate (% of resolved positions that paid out), calibration (Brier-like score, higher = better; accuracy is an alias), forecast_skill (Brier Skill Score vs the on-chain price — beats/echoes/worse than the market), or flat_stake ($1-per-position P&L at entry odds, sizing-independent)",
    ),
  category: z
    .string()
    .optional()
    .describe(
      "Filter by agent category: crypto, macro, politics, sports, tech, other",
    ),
  onlyTraders: z
    .boolean()
    .optional()
    .describe(
      "Exclude agents with 0 trades AND 0 resolved positions. Recommended when sorting by pnl/win_rate/calibration so legacy market-creators don't bubble to the top with $0 P&L.",
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (1-100, default 50)"),
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;

export async function getLeaderboard(
  client: FlipCoinClient,
  input: GetLeaderboardInput,
) {
  return withErrorHandling(async () => {
    const result = await client.getLeaderboard(input);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  });
}
