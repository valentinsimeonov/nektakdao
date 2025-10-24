
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // No external domains → only your local/public images allowed
    remotePatterns: [],
  },
};

module.exports = nextConfig;







// /** @type {import('next').NextConfig} */
// const nextConfig = {
// 	poweredByHeader: false, // Hide "X-Powered-By: Next.js"

// 	images: {
// 	  domains: ['dashboard-assets.dappradar.com', 'dappradar.com'],
// 	},
// };

// module.exports = nextConfig;





// /** @type {import('next').NextConfig} */
// const nextConfig = {
// 	// Your other Next.js config options here
// 	images: {
// 	  domains: ['dashboard-assets.dappradar.com', 'dappradar.com'],
// 	},
// 	// Add more configurations here
//   };
  
//   module.exports = nextConfig;







// /** @type {import('next').NextConfig} */
// const nextConfig = {}

// With EsLint
//////////////////
// module.exports = nextConfig

// For Dapps Images
// module.exports = {
// 	images: {
// 	  domains: ['dashboard-assets.dappradar.com'],
// 	},
//   };


// Without EsLint
////////////////////

// module.exports = {
// 	eslint: {
// 	  ignoreDuringBuilds: true,
// 	},
//   };



  