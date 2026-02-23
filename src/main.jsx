import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // Додає базовий скидання CSS для MUI
import App from './App.jsx'
import theme from './theme';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Доступна нова версія. Оновити?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Додаток готовий до роботи офлайн');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)