import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('SW registered:', reg.scope);
  } catch (err) {
    console.warn('SW register failed:', err);
  }
}

registerSW().catch(e => console.warn(e));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
