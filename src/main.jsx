import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './context';
import App from './App';
import './styles.css';

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="boot-screen">
        <h1>Let’s get you back on track.</h1>
        <p>The workspace ran into an unexpected problem.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload workspace
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}

// Keep previously shared hash links working with clean browser routes.
if (location.hash.startsWith('#/')) {
  const route = location.hash.slice(1);
  if (!route.startsWith('//')) history.replaceState(null, '', route);
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </ErrorBoundary>,
);
