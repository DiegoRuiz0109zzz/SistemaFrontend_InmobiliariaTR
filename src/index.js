import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SystemConfig } from './config/SystemConfig';
import { ThemeProvider } from './context/ThemeContext';

// Aplicar configuración global al DOM (Favicon y Título)
const applyGlobalConfig = () => {
  // Title
  if (SystemConfig.browserTitle) {
    document.title = SystemConfig.browserTitle;
  }

  // Icons
  const iconLink = document.querySelector("link[rel*='icon']");
  if (iconLink) {
    iconLink.href = process.env.PUBLIC_URL + SystemConfig.logoPath;
  }

  const appleIconLink = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIconLink) {
    appleIconLink.href = process.env.PUBLIC_URL + SystemConfig.logoPath;
  }
};



applyGlobalConfig();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);