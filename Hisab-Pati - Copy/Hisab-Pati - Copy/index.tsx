
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// ✅ STEP 1: GLOBAL ERROR HANDLER - FORCE VISIBILITY
window.onerror = function (msg: any, url: any, line: any, col: any, error: any) {
  console.error('❌ GLOBAL ERROR:', error);
  document.body.innerHTML = `
    <div style="background: #000; color: #f00; font-family: monospace; padding: 20px; white-space: pre-wrap; overflow: auto; height: 100vh;">
      <h1 style="color: #ff6b6b; font-size: 24px; margin-bottom: 20px;">⚠️ RUNTIME CRASH DETECTED</h1>
      <h2 style="color: #ffd93d; margin-bottom: 10px;">Error Stack:</h2>
      <pre style="background: #1a1a1a; padding: 15px; border-left: 3px solid #f00; font-size: 12px; overflow: auto;">${error?.stack || msg}</pre>
      <h2 style="color: #ffd93d; margin-bottom: 10px; margin-top: 20px;">Location:</h2>
      <p>${url} (Line ${line}:${col})</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        Reload App
      </button>
    </div>
  `;
  return true;
};

window.addEventListener('error', (event) => {
  console.error('❌ ERROR EVENT:', event.error);
  document.body.innerHTML = `
    <div style="background: #000; color: #f00; font-family: monospace; padding: 20px; white-space: pre-wrap; overflow: auto; height: 100vh;">
      <h1 style="color: #ff6b6b; font-size: 24px; margin-bottom: 20px;">⚠️ RUNTIME ERROR</h1>
      <pre style="background: #1a1a1a; padding: 15px; border-left: 3px solid #f00; font-size: 12px; overflow: auto;">${event.error?.stack || event.message}</pre>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        Reload App
      </button>
    </div>
  `;
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  console.error('❌ RENDER CATCH ERROR:', error);
  document.body.innerHTML = `
    <div style="background: #000; color: #f00; font-family: monospace; padding: 20px; white-space: pre-wrap; overflow: auto; height: 100vh;">
      <h1 style="color: #ff6b6b; font-size: 24px; margin-bottom: 20px;">⚠️ RENDER ERROR</h1>
      <pre style="background: #1a1a1a; padding: 15px; border-left: 3px solid #f00; font-size: 12px; overflow: auto;">${error?.stack || error?.toString()}</pre>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        Reload App
      </button>
    </div>
  `;
}
