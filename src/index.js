import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppMain from './AppMain';
import AppErrorBoundary from './components/AppErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppMain />
    </AppErrorBoundary>
  </React.StrictMode>
);
