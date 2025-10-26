// frontend/config/wagmi.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Get environment variables with fallbacks
const NEXT_PUBLIC_BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

const NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Validate WalletConnect Project ID
if (!NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    " NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect features will be limited."
  );
}

// Create and export wagmi config using RainbowKit's helper
export const wagmiConfig = getDefaultConfig({
  appName: "Nektak DAO",
  projectId: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(NEXT_PUBLIC_BASE_SEPOLIA_RPC),
  },
  ssr: true, // Enable server-side rendering support
});