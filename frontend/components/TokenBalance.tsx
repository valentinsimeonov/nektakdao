// frontend/components/TokenBalance.tsx
"use client";

import React from "react";
import { useAccount, useContractRead } from "wagmi";
import { erc20Abi } from "viem";

type TokenBalanceProps = {
  tokenAddress: `0x${string}`;
};

export function TokenBalance({ tokenAddress }: TokenBalanceProps) {
  const { address } = useAccount();

  const { data, isError, isLoading } = useContractRead({
    address: tokenAddress,
    abi: erc20Abi as any,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    // Use the 'query' property to set reactive options
    query: {
      // Poll every 10 seconds
      refetchInterval: 10000,
    },
  });

  if (isLoading) return <div>Loading token balance…</div>;
  if (isError) return <div>Error reading token balance</div>;

  return <div>Token balance: {data ? String(data) : "—"}</div>;
}




