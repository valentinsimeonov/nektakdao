// frontend/app/layout.tsx
"use client";

import "./globals.css";
import React from "react";
import store from "../store/store";
import { Provider } from "react-redux";
import { ApolloProvider } from "@apollo/client";
import client from "../api/apolloclient";

// wagmi / rainbowkit
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { createConfig, WagmiConfig } from "wagmi"; // <-- WagmiConfig imported here
import { createPublicClient, http } from "viem";

// Environment
const NEXT_PUBLIC_BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "http://host.docker.internal:8545";
const NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Minimal chain object for local testing / Base Sepolia (adjust id if needed)
const baseSepolia: any = {
  id: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [NEXT_PUBLIC_BASE_SEPOLIA_RPC] } },
  blockExplorers: { default: { name: "Explorer", url: "https://explorer.local" } },
  testnet: true,
};

// Create viem public client (we pass this to wagmi)
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(NEXT_PUBLIC_BASE_SEPOLIA_RPC),
});

// Use getDefaultWallets (your installed version expects appName/projectId)
const walletDefaults: any = getDefaultWallets({
  appName: "Nektak DAO",
  projectId: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
});

// Extract connectors (cast to any to accommodate version typing differences)
const connectors = walletDefaults.connectors as any;

// Create wagmi config; cast to any to avoid occasional type mismatches in these versions
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
} as any);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <title>Nektak | Learn, Govern, and Change the World Together</title>
      </head>

      <body>
        <ApolloProvider client={client}>
          <Provider store={store}>
            <WagmiConfig config={wagmiConfig as any}>
              {/* No extra props to RainbowKitProvider for compatibility with your version */}
              <RainbowKitProvider>
                <div id="klaro"> </div>
                <div>{children}</div>
              </RainbowKitProvider>
            </WagmiConfig>
          </Provider>
        </ApolloProvider>
      </body>
    </html>
  );
}