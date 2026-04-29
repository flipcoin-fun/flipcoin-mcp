import { z } from "zod";
import type { FlipCoinClient } from "../client.js";
import { withErrorHandling } from "./util.js";

// --- Deposit ---

export const vaultDepositSchema = z.object({
  amount: z
    .string()
    .optional()
    .describe(
      "Exact amount to deposit (USDC base units, 6 decimals). Mutually exclusive with targetBalance.",
    ),
  targetBalance: z
    .string()
    .optional()
    .describe(
      "Target vault balance (USDC base units). API auto-computes the delta to deposit.",
    ),
  auto_sign: z
    .boolean()
    .optional()
    .default(true)
    .describe("Auto-sign with session key (Mode B)."),
});

export type VaultDepositInput = z.infer<typeof vaultDepositSchema>;

export async function vaultDeposit(
  client: FlipCoinClient,
  input: VaultDepositInput,
) {
  if (!input.amount && !input.targetBalance) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: either 'amount' or 'targetBalance' is required.",
        },
      ],
      isError: true,
    };
  }
  // Step 1: Create intent
  let intent;
  try {
    intent = await client.vaultDepositIntent({
      amount: input.amount,
      targetBalance: input.targetBalance,
    });
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Vault deposit intent failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }

  // Step 2: Relay (intent expires in 35s — relay immediately)
  let relay;
  try {
    relay = await client.vaultDepositRelay({
      intentId: intent.intentId,
      auto_sign: input.auto_sign ?? true,
    });
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: false,
              error: "Vault deposit relay failed. Intent expires in ~35 seconds.",
              relayError:
                error instanceof Error ? error.message : String(error),
              intentId: intent.intentId,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ intent, relay }, null, 2),
      },
    ],
  };
}

// --- Withdraw ---

export const vaultWithdrawSchema = z.object({
  amount: z
    .string()
    .optional()
    .describe(
      "Exact amount to withdraw (USDC base units, 6 decimals). Mutually exclusive with targetBalance.",
    ),
  targetBalance: z
    .string()
    .optional()
    .describe(
      "Target vault balance to withdraw DOWN to (USDC base units).",
    ),
  signedTransaction: z
    .string()
    .optional()
    .describe(
      "RLP-encoded signed Ethereum transaction. If omitted, the tool returns the raw transaction for the owner to sign — auto_sign is NOT supported for withdrawals.",
    ),
});

export type VaultWithdrawInput = z.infer<typeof vaultWithdrawSchema>;

export async function vaultWithdraw(
  client: FlipCoinClient,
  input: VaultWithdrawInput,
) {
  if (!input.amount && !input.targetBalance) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: either 'amount' or 'targetBalance' is required.",
        },
      ],
      isError: true,
    };
  }
  return withErrorHandling(async () => {
    const intent = await client.vaultWithdrawIntent({
      amount: input.amount,
      targetBalance: input.targetBalance,
    });

    if (!input.signedTransaction) {
      // Return raw transaction for owner to sign
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                step: "sign_required",
                intent,
                hint: "Owner wallet must sign the transaction in 'intent.transaction' and resubmit this tool with 'signedTransaction' (RLP-encoded). Auto-sign is NOT supported for withdrawals.",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    const relay = await client.vaultWithdrawRelay({
      intentId: intent.intentId,
      signedTransaction: input.signedTransaction,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ intent, relay }, null, 2),
        },
      ],
    };
  });
}
