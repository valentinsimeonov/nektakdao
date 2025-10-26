// frontend/app/layout.tsx
import "./globals.css";
import React from "react";
import { Providers } from "../config/Providers";

// export const metadata = {
//   title: "Nektak | Learn, Govern, and Change the World Together",
//   description: "Decentralized Autonomous Organization for learning and governance",
// };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
              <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;700&display=swap" rel="stylesheet" />
        {/* <title>Decentralised System, Cryptocurrency Prices, Learning, Ecosystems Map and Community Reviews for Web 3/Blockchains/Coins/Tokens/Dapps</title> */}
        {/* <title>Nektak DAO, Token and Portal | Learn, Govern, and Change the World Together</title> */}
        <title>Nektak | Learn, Govern, and Change the World Together - Crypto Analytics, DAO & Governance Token</title>

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2701812300375534" crossOrigin="anonymous"></script>
      </head>


      <body>
        <Providers>
          <div id="klaro"> </div>
          <div>{children}</div>
        </Providers>
      </body>
    </html>
  );
}