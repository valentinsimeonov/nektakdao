


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Webpack configuration to handle missing modules
  webpack: (config, { isServer }) => {
    // Handle missing optional dependencies
    config.externals.push("pino-pretty", "encoding");
    
    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
    ];

    // Fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }

    return config;
  },

  // Environment variables accessible on client side
  env: {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_BASE_SEPOLIA_RPC: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  },

  // Disable static page generation for pages that use Web3
  // This prevents "Cannot read properties of undefined" during build
  experimental: {
    // Disable static optimization for dynamic pages
  },
};

module.exports = nextConfig;












// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   poweredByHeader: false,
//   images: {
//     // No external domains → only your local/public images allowed
//     remotePatterns: [],
//   },
// };

// module.exports = nextConfig;




