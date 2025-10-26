//frontend/components/ConnectWallet.tsx

"use client";

import React, { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";

/**
 * Minimal wallet UI:
 * - ConnectButton (RainbowKit)
 * - Shows address (shortened), balance and network (from connector chains if available)
 */
export default function ConnectWallet(): JSX.Element {
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({
    address,
    query: { refetchInterval: 10000 }, // poll every 10s
  });

  // safe chain name from connector
  const chains = (connector as any)?.chains ?? [];
  const chainName = chains?.[0]?.name ?? "Unknown";

  useEffect(() => {
    if (isConnected) {
      console.log("Wallet connected:", { address, connector, chainName });
    } else {
      console.log("Wallet disconnected");
    }
  }, [isConnected, address, connector, chainName]);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <ConnectButton />
      <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
        {isConnected ? (
          <>
            <div>Addr: {shortAddress}</div>
            <div>Bal: {balance ? `${balance.formatted} ${balance.symbol}` : "—"}</div>
            <div>Net: {chainName}</div>
          </>
        ) : (
          <div>Not connected</div>
        )}
      </div>
    </div>
  );
}