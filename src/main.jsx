import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/style.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/login.css';
import './styles/reports.css';
import './styles/tools.css';
import './styles/session-timeout.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
