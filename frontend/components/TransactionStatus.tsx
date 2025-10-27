// frontend/components/TransactionStatus.tsx
"use client";

import React from "react";

type TransactionStatusProps = {
  txHash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  error?: Error | null;
  explorerUrl?: string;
};

export default function TransactionStatus({
  txHash,
  isPending,
  isConfirming,
  isConfirmed,
  error,
  explorerUrl = "https://sepolia.basescan.org/tx/",
}: TransactionStatusProps) {
  if (!txHash && !isPending && !error) return null;

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        borderRadius: "8px",
        background: "#1a2332",
        border: "1px solid #2a3a4a",
      }}
    >
      {/* Pending State */}
      {isPending && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ffa500" }}>
          <span className="spinner">⏳</span>
          <span>Waiting for wallet confirmation...</span>
        </div>
      )}

      {/* Transaction Sent */}
      {txHash && !isConfirmed && !error && (
        <div>
          <div style={{ marginBottom: "8px", color: "#66d9ef" }}>
            📤 Transaction Sent
          </div>
          <a
            href={`${explorerUrl}${txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#66d9ef",
              textDecoration: "none",
              fontFamily: "monospace",
              fontSize: "0.9em",
            }}
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)} 🔗
          </a>
        </div>
      )}

      {/* Confirming State */}
      {isConfirming && (
        <div style={{ marginTop: "8px", color: "#ffa500" }}>
          <span className="spinner">⏳</span> Waiting for blockchain confirmation...
        </div>
      )}

      {/* Confirmed State */}
      {isConfirmed && (
        <div style={{ marginTop: "8px", color: "#66d9ef" }}>
          ✅ Transaction Confirmed!
          {txHash && (
            <div style={{ marginTop: "4px" }}>
              <a
                href={`${explorerUrl}${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#66d9ef",
                  textDecoration: "none",
                  fontSize: "0.9em",
                }}
              >
                View on Explorer 🔗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ color: "#ff6b6b" }}>
          ❌ Error: {error.message || "Transaction failed"}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}