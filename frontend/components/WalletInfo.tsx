"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import type { Connector } from "wagmi";

export default function WalletInfo(): JSX.Element {
  const { address, isConnected, connector } = useAccount();

  const { data: balance } = useBalance({
    address,
    query: { refetchInterval: 10000 }, // polls every 10s
  });

  // Safe access to chain name
  const chains = (connector as Connector & { chains?: { name?: string }[] })?.chains;
  const chainName = chains?.[0]?.name ?? "Unknown";

  return (
    <div className="wallet-info">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <ConnectButton />
        <div>
          {isConnected ? (
            <>
              <div>Address: {address}</div>
              <div>
                Balance: {balance ? `${balance.formatted} ${balance.symbol}` : "—"}
              </div>
              <div>Network: {chainName}</div>
            </>
          ) : (
            <div>Not connected</div>
          )}
        </div>
      </div>
    </div>
  );
}