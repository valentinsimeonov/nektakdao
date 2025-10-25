// components/TokenBalance.tsx
"use client";

import React from "react";
import { useAccount, useContractRead } from "wagmi";
import { erc20ABI } from "wagmi";

export function TokenBalance({ tokenAddress }: { tokenAddress: `0x${string}` }) {
  const { address } = useAccount();

  const { data } = useContractRead({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    watch: true,
  });

  return <div>Token balance: {data?.toString() ?? "—"}</div>;
}