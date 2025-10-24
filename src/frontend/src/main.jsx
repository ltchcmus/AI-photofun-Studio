import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- IMPORT
import App from './App.jsx';
import './index.css'; // CSS global

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> 
      <App />
    </BrowserRouter> 
  </React.StrictMode>,
);