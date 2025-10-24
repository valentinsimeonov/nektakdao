//layout.tsx
"use client";

import './globals.css';
import dynamic from 'next/dynamic';
import store from '../store/store';
import {Provider} from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import client from '../api/apolloclient';
// import ClientOnlyWrapper from '../components/ClientOnlyWrapper';
// import { ThemeProvider } from '../components/ThemeProvider';
// import ConsentManager from '../components/ConsentManager';

	

export default function RootLayout({ children }: { children: React.ReactNode }) {


  return (
    <html lang="en">
		<head>
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
          	<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;700&display=swap" rel="stylesheet" />
			<title>Nektak | Learn, Govern, and Change the World Together - Crypto Analytics, DAO & Governance Token</title>
		</head>
		
		<body >
			{/* <SessionProvider> */}
			<ApolloProvider client={client}>
				<Provider store={store}>
					{/* <ClientOnlyWrapper> */}
						<div id="klaro"> </div>
						{/* <ConsentManager />       */}
						{/* <ThemeProvider> */}
							<div >
								{children}
							</div>
						{/* </ThemeProvider> */}
					{/* </ClientOnlyWrapper> */}
				</Provider>
			</ApolloProvider>
			{/* </SessionProvider> */}
		</body>
	</html>
  );
};












