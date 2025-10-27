
// frontend/components/BoxInteraction.tsx
"use client";

import React, { useState, useEffect } from "react";
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
      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
        resetWrite();
      }, 5000);
    }
  }, [isConfirmed, refetch, resetWrite]);

  // Handle confirmation error
  useEffect(() => {
    if (confirmError) {
      setStatusMessage(`❌ Transaction failed: ${confirmError.message}`);
    }
  }, [confirmError]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setStatusMessage(`❌ Write error: ${writeError.message}`);
    }
  }, [writeError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!isConnected) {
      setStatusMessage("⚠️ Please connect your wallet first.");
      return;
    }

    if (!address) {
      setStatusMessage("⚠️ No wallet address found.");
      return;
    }

    if (valueToStore === "") {
      setStatusMessage("⚠️ Enter a value to store.");
      return;
    }

    try {
      // Reset previous state
      resetWrite();
      
      // Convert value to BigInt
      const valueBigInt = BigInt(valueToStore as number);

      // Call writeContract - this returns void in Wagmi v2
      writeContract({
        address: targetAddress,
        abi: BOX_ABI,
        functionName: "store",
        args: [valueBigInt],
      });

      setStatusMessage("📤 Transaction sent - waiting for confirmation...");
    } catch (err: any) {
      console.error("Write error:", err);
      setStatusMessage(`❌ Error: ${err?.message || "Unknown error"}`);
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
      <h3 style={{ marginTop: 0, color: "#66d9ef" }}>📦 Box Contract Interaction</h3>

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
        {isReading && <span style={{ marginLeft: "8px", fontSize: "0.9em" }}>🔄</span>}
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

      {/* Transaction Hash */}
      {txHash && (
        <div style={{ 
          marginBottom: "12px",
          padding: "12px",
          background: "#1a2332",
          borderRadius: "8px",
        }}>
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
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div style={{ 
          marginTop: "12px",
          padding: "12px",
          background: statusMessage.includes("❌") ? "#4a2a2a" : "#2a4a2a",
          border: `1px solid ${statusMessage.includes("❌") ? "#ff6b6b" : "#66d9ef"}`,
          borderRadius: "8px",
          color: statusMessage.includes("❌") ? "#ff6b6b" : "#66d9ef",
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
          ⚠️ Connect your wallet to interact with the contract
        </div>
      )}

      {/* Transaction Status Indicators */}
      <div style={{ marginTop: "16px", fontSize: "0.9em", color: "#999" }}>
        {isWritePending && <div>⏳ Waiting for wallet confirmation...</div>}
        {isConfirming && <div>⏳ Waiting for blockchain confirmation...</div>}
        {isConfirmed && <div style={{ color: "#66d9ef" }}>✅ Transaction confirmed!</div>}
      </div>
    </div>
  );
}






































































































pragma solidity ^0.8.20;


/**
 * NektakToken (NKT)
 *
 * Features:
 * - ERC20 + ERC20Permit + ERC20Votes (OpenZeppelin)
 * - AccessControl with MINTER_ROLE and PAUSER_ROLE (optional)
 * - Minting restricted to MINTER_ROLE (timelock / governor pipeline should own this role)
 * - mintWithPurpose emits a Purpose-tagged event for transparency
 * - Mint cap per rolling period (e.g., 5% circulating supply per 90 days)
 * - Prevents users from delegating to other addresses; every holder is implicitly self-delegated.
 *
 * Notes:
 * - We use internal _delegate calls to self on mint and on first receipt.
 * - We override public delegate / delegateBySig to revert to enforce "no manual delegation".
 */

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NektakToken is ERC20Votes, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // optional admin role for pausing, etc.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Mint cap logic
    uint256 public capNumerator;   // e.g., 5 -> 5%
    uint256 public capDenominator; // e.g., 100
    uint256 public capPeriod;      // e.g., 90 days = 90 * 86400

    // Track minted amount per period (windowed using epoch-based windows)
    mapping(uint256 => uint256) public mintedInWindow;

    event MintWithPurpose(address indexed to, uint256 amount, string purpose);
    event CapParamsUpdated(uint256 numerator, uint256 denominator, uint256 period);
    event MinterChanged(address indexed account, bool granted);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        uint256 _capNumerator,
        uint256 _capDenominator,
        uint256 _capPeriodSeconds,
        address admin // initial admin (deployer)
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        require(_capDenominator > 0, "denominator=0");
        capNumerator = _capNumerator;
        capDenominator = _capDenominator;
        capPeriod = _capPeriodSeconds;

        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(PAUSER_ROLE, admin);

        // initial mint to admin (part of genesis)
        if (initialSupply_ > 0) {
            _mint(admin, initialSupply_);
            // auto self-delegate for admin
            _delegate(admin, admin);
            emit MintWithPurpose(admin, initialSupply_, "genesis");
        }
    }

    // ========== OVERRIDES for ERC20Votes hooks ==========
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);

        // ensure recipient is self-delegated if not delegated previously
        // If recipient has no delegate (address(0)), assign self-delegation.
        // NOTE: _delegates is private in OZ; we use getVotes? There is _delegates mapping in OZ but private.
        // We cannot read private _delegates; instead we mimic: attempt to call _delegate(to, to) if it is safe.
        // Calling _delegate for same address will update checkpoints correctly (double delegations handled).
        // This keeps voting power equal to balance for holders who never delegated externally.
        // Because we block public delegate calls, external delegation cannot occur.
        // _delegate is internal function in ERC20Votes, allowed here.

        if (to != address(0)) {
            // Safe to call every time; if already delegated to itself this will still operate but is cheap-ish.
            // This guarantees holders have voting power equal to token balance.
            _delegate(to, to);
        }
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address from, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(from, amount);
    }

    // ========== Disallow manual delegation ==========
    // Override public functions to prevent manual delegation to other addresses.
    function delegate(address /*delegatee*/) public pure override {
        revert("Delegation disabled; votes == token balance");
    }

    function delegateBySig(
        address /*delegatee*/,
        uint256 /*deadline*/,
        uint8 /*v*/,
        bytes32 /*r*/,
        bytes32 /*s*/
    ) public pure override {
        revert("Delegation disabled; votes == token balance");
    }

    // ========== Minting functions (MINTER_ROLE required) ==========
    /**
     * @dev Mint tokens with a purpose string. Enforces cap per configured period.
     */
    function mintWithPurpose(address to, uint256 amount, string calldata purpose) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "to=0");
        _enforceMintCap(amount);
        _mint(to, amount);
        // auto-delegate to self for recipient (ensures voting power)
        _delegate(to, to);
        emit MintWithPurpose(to, amount, purpose);
    }

    /**
     * @dev Mint without purpose (still emits an event with empty string).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _enforceMintCap(amount);
        _mint(to, amount);
        _delegate(to, to);
        emit MintWithPurpose(to, amount, "");
    }

    /**
     * @dev Burn tokens from an address (timelock must have MINTER_ROLE to call if burning treasury).
     */
    function burnFromTreasury(address from, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        // uses ERC20Burnable._burn, but keeping checks explicit
        _burn(from, amount);
    }

    // ========== Mint cap enforcement ==========
    function _enforceMintCap(uint256 amount) internal {
        if (capNumerator == 0) return; // 0 means unlimited
        uint256 window = block.timestamp / capPeriod;
        uint256 minted = mintedInWindow[window];
        // using totalSupply as proxy for circulating supply. If you want to exclude treasury,
        // pass an explicit treasury address to the function and compute circulatingSupply = totalSupply() - balanceOf(treasury)
        uint256 circulating = totalSupply();
        // compute max allowed this window
        uint256 maxAllowed = (circulating * capNumerator) / capDenominator;
        // handle zero circulating case (e.g., genesis time) by allowing mint
        if (circulating == 0) {
            // allow mint without cap (initialization)
            mintedInWindow[window] = minted + amount;
            return;
        }
        require(minted + amount <= maxAllowed, "mint cap exceeded for period");
        mintedInWindow[window] = minted + amount;
    }

    // ========== Admin functions to configure caps ==========
    function setCapParams(uint256 _numerator, uint256 _denominator, uint256 _periodSeconds) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_denominator > 0, "denominator=0");
        capNumerator = _numerator;
        capDenominator = _denominator;
        capPeriod = _periodSeconds;
        emit CapParamsUpdated(_numerator, _denominator, _periodSeconds);
    }

    // Convenience to grant minter to timelock (governance should use this)
    function grantMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
        emit MinterChanged(minter, true);
    }
    function revokeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
        emit MinterChanged(minter, false);
    }

    // ========= Pausable controls =========
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== The following overrides are required by Solidity ==========
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "token paused");
    }

    // Required override for ERC165/AccessControl + ERC20Votes
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}