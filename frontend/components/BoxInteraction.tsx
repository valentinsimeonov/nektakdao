// frontend/components/BoxInteraction.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

const BOX_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "newValue", type: "uint256" }],
    name: "store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "retrieve",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "newValue", type: "uint256" }],
    name: "ValueChanged",
    type: "event",
  },
] as const;

type Props = {
  boxAddress?: `0x${string}`;
};

export default function BoxInteraction({ boxAddress }: Props) {
  const { address, isConnected } = useAccount();
  const [valueToStore, setValueToStore] = useState<number | "">("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Get Box contract address
  const targetAddress = (boxAddress || process.env.NEXT_PUBLIC_BOX_ADDRESS) as `0x${string}`;

  // Read current stored value
  const { 
    data: stored, 
    refetch, 
    isFetching: isReading 
  } = useReadContract({
    address: targetAddress,
    abi: BOX_ABI,
    functionName: "retrieve",
  });

  // Write contract hook
  const { 
    data: txHash, 
    writeContract, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      setStatusMessage("✅ Transaction confirmed!");
      // Refetch the stored value
      refetch();

      // Clear only the success message after 5s — DO NOT reset the tx data
      const t = setTimeout(() => {
        setStatusMessage(null);
        // <-- intentionally do NOT call resetWrite() here so txHash remains visible
      }, 5000);

      return () => clearTimeout(t);
    }
  }, [isConfirmed, refetch]); // no resetWrite dependency

  // Handle confirmation error
  useEffect(() => {
    if (confirmError) {
      setStatusMessage(`X Transaction failed: ${confirmError.message}`);
    }
  }, [confirmError]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setStatusMessage(`X Write error: ${writeError.message}`);
    }
  }, [writeError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!isConnected) {
      setStatusMessage(" Please connect your wallet first.");
      return;
    }

    if (!address) {
      setStatusMessage(" No wallet address found.");
      return;
    }

    if (valueToStore === "") {
      setStatusMessage(" Enter a value to store.");
      return;
    }

    try {
      // Reset previous state (keeps behavior: new tx clears old tx)
      resetWrite();
      
      // Convert value to BigInt
      const valueBigInt = BigInt(valueToStore as number);

      // Call writeContract - this returns void in Wagmi v2 (wallet popup), but wagmi keeps the tx hash in `data`
      writeContract({
        address: targetAddress,
        abi: BOX_ABI,
        functionName: "store",
        args: [valueBigInt],
      });

      setStatusMessage(" Transaction sent - waiting for confirmation...");
    } catch (err: any) {
      console.error("Write error:", err);
      setStatusMessage(`X Error: ${err?.message || "Unknown error"}`);
    }
  };

  // Format display value
  const displayedValue = stored ? String(stored) : isReading ? "Loading..." : "—";

  // Explorer link
  const explorerBase = "https://sepolia.basescan.org/tx/";

  // Determine button state
  const isButtonDisabled = !isConnected || isWritePending || isConfirming || valueToStore === "";
  const buttonText = isWritePending 
    ? "Sending..." 
    : isConfirming 
    ? "Confirming..." 
    : "Store Value";

  return (
    <div 
      style={{ 
        padding: "20px", 
        background: "linear-gradient(135deg, #0b1220 0%, #1a2332 100%)", 
        color: "white", 
        borderRadius: "12px",
        border: "1px solid #2a3a4a",
        maxWidth: "600px",
        margin: "20px auto",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#66d9ef" }}> Box Contract Interaction</h3>

      {/* Contract Address */}
      <div style={{ marginBottom: "12px" }}>
        <strong>Contract:</strong>{" "}
        <span style={{ 
          fontFamily: "monospace", 
          fontSize: "0.9em",
          background: "#1a2332",
          padding: "4px 8px",
          borderRadius: "4px",
        }}>
          {targetAddress}
        </span>
      </div>

      {/* Current Value */}
      <div style={{ 
        marginBottom: "16px",
        padding: "12px",
        background: "#1a2332",
        borderRadius: "8px",
      }}>
        <strong>Current Stored Value:</strong>{" "}
        <span style={{ 
          fontSize: "1.2em", 
          color: "#66d9ef",
          fontWeight: "bold",
        }}>
          {displayedValue}
        </span>
        {isReading && <span style={{ marginLeft: "8px", fontSize: "0.9em" }}></span>}
      </div>

      {/* Store Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ flex: 1 }}>
            <div style={{ marginBottom: "4px", fontSize: "0.9em" }}>New Value:</div>
            <input
              style={{ 
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #2a3a4a",
                background: "#1a2332",
                color: "white",
                fontSize: "1em",
              }}
              type="number"
              placeholder="Enter a number"
              value={valueToStore}
              onChange={(e) => setValueToStore(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <button
            type="submit"
            disabled={isButtonDisabled}
            style={{ 
              marginTop: "20px",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              background: isButtonDisabled ? "#555" : "#66d9ef",
              color: isButtonDisabled ? "#999" : "#0b1220",
              fontWeight: "bold",
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {buttonText}
          </button>
        </div>
      </form>

      {/* Transaction Hash (keeps showing until user clears) */}
      {txHash && (
        <div style={{ 
          marginBottom: "12px",
          padding: "12px",
          background: "#1a2332",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <strong>Transaction:</strong>{" "}
            <a 
              href={`${explorerBase}${txHash}`} 
              target="_blank" 
              rel="noreferrer" 
              style={{ 
                color: "#66d9ef",
                textDecoration: "none",
                fontFamily: "monospace",
              }}
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
            {" "}
            <a 
              href={`${explorerBase}${txHash}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ 
                marginLeft: "8px",
                fontSize: "0.9em",
              }}
            >
              🔗
            </a>
          </div>

          {/* Manual clear button so user can remove saved tx hash */}
          <div>
            <button
              onClick={() => {
                resetWrite(); // clears txHash/data
                setStatusMessage(null);
              }}
              style={{
                background: "transparent",
                border: "1px solid #2a3a4a",
                color: "#66d9ef",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              type="button"
            >
              Clear Tx
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div style={{ 
          marginTop: "12px",
          padding: "12px",
          background: statusMessage.includes("X") ? "#4a2a2a" : "#2a4a2a",
          border: `1px solid ${statusMessage.includes("X") ? "#ff6b6b" : "#66d9ef"}`,
          borderRadius: "8px",
          color: statusMessage.includes("X") ? "#ff6b6b" : "#66d9ef",
        }}>
          {statusMessage}
        </div>
      )}

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <div style={{ 
          marginTop: "12px",
          padding: "12px",
          background: "#4a3a2a",
          border: "1px solid #ffa500",
          borderRadius: "8px",
          color: "#ffa500",
        }}>
           Connect your wallet to interact with the contract
        </div>
      )}

      {/* Transaction Status Indicators */}
      <div style={{ marginTop: "16px", fontSize: "0.9em", color: "#999" }}>
        {isWritePending && <div>⏳ Waiting for wallet confirmation...</div>}
        {isConfirming && <div>⏳ Waiting for blockchain confirmation...</div>}
        {isConfirmed && <div style={{ color: "#66d9ef" }}> Transaction confirmed!</div>}
      </div>
    </div>
  );
}