// frontend/components/WalletInfo.tsx
"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useNetwork } from "wagmi";

export default function WalletInfo(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
    watch: true,
  });
  const { chain } = useNetwork();

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
              <div>Network: {chain?.name ?? "Unknown"}</div>
            </>
          ) : (
            <div>Not connected</div>
          )}
        </div>
      </div>
    </div>
  );
}



