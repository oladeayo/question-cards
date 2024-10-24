// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Optional, if you have global styles
import QuestionCards from './QuestionCards';  // Import your main component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuestionCards />
  </React.StrictMode>
);
