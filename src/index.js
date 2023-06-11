import React from 'react'; // Importing React library
import ReactDOM from 'react-dom/client'; // Importing ReactDOM for DOM manipulations
import './index.css'; // Importing the main stylesheet for this app
import App from './App'; // Importing the App component
import reportWebVitals from './reportWebVitals'; // Importing reportWebVitals for measuring performance 
import '@rainbow-me/rainbowkit/styles.css'; // Importing RainbowKit styles
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'; // Importing RainbowKit components and functions for wallet connection
import { configureChains, createConfig, WagmiConfig } from 'wagmi'; // Importing functions from wagmi library for blockchain configuration
import { mainnet, polygon, optimism, arbitrum, goerli, hardhat, sepolia } from 'wagmi/chains'; // Importing various blockchain networkss
import { publicProvider } from 'wagmi/providers/public'; // Importing publicProvider from wagmi

// Configuring blockchains with public providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    sepolia, 
    // mainnet,
    hardhat, 
  ],
  [
    publicProvider()
  ]
);
// Setting up default wallets for the specified chains
const { connectors } = getDefaultWallets({
  appName: 'Crypto Bank',
  projectId: '',
  chains,
});

// Creating the configuration for wagmi 
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Selecting the root div where the app will be attached
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendering the app inside WagmiConfig and RainbowKitProvider 
root.render(
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains}>
      <App />
    </RainbowKitProvider>
  </WagmiConfig>
);

// Measuring performance of the app with reportWebVitals
reportWebVitals();
