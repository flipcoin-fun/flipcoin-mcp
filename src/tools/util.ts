/** Shared helper for MCP tool error handling. */

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

export async function withErrorHandling(
  fn: () => Promise<ToolResult>,
): Promise<ToolResult> {
  try {
    return await fn();
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
}

/** Ethereum address regex: 0x + 40 hex chars */
export const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/** Bytes32 hex string regex: 0x + 64 hex chars */
export const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;
