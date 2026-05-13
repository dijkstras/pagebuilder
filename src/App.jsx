import React, { useState } from 'react';
import { PageProvider } from './store/pageStore.jsx';
import { AppContent } from './AppContent';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'mindtickle.com') {
      setIsLoggedIn(true);
    } else {
      setError('Access denied');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c'
      }}>
        <div style={{
          backgroundColor: '#2d3748',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid #4a5568',
          minWidth: '320px',
          maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '24px', color: '#f7fafc', textAlign: 'center' }}>
            Pagebuilder Login
          </h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mindtickle.com"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1a202c',
                  border: error ? '1px solid #fc8181' : '1px solid #4a5568',
                  borderRadius: '4px',
                  color: '#f7fafc',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {error && (
              <p style={{ color: '#fc8181', fontSize: '12px', marginBottom: '16px' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <PageProvider>
      <AppContent />
    </PageProvider>
  );
}

export default App;
