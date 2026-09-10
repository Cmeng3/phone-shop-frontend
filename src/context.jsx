import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, session } from './api';

const Auth = createContext(null);
const Toast = createContext(null);
export const useAuth = () => useContext(Auth);
export const useToast = () => useContext(Toast);

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState('');
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((item) => item.id !== id)), 5500);
  }, []);
  const refresh = useCallback(async () => {
    const response = await api('auth/profile');
    setUser(response.data);
    return response.data;
  }, []);
  const bootstrap = useCallback(async () => {
    setLoading(true);
    setBootstrapError('');
    try {
      if (session.get()) await refresh();
    } catch (error) {
      if (error.status !== 401) setBootstrapError(error.message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      notify('Your session ended. Please sign in again.', 'error');
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, [notify]);
  async function login(identifier, password) {
    const result = await api('auth/login', { method: 'POST', body: { identifier, password } });
    session.set(result.data.token);
    setUser(result.data.user);
  }
  async function logout() {
    await api('auth/logout', { method: 'POST', body: {} });
    session.clear();
    setUser(null);
  }
  function signedOut() {
    session.clear();
    setUser(null);
  }
  return (
    <Auth.Provider
      value={{ user, loading, bootstrapError, bootstrap, login, logout, refresh, signedOut }}
    >
      <Toast.Provider value={notify}>
        {children}
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span>{t.type === 'success' ? '✓' : '!'} </span>
              {t.message}
              <button
                aria-label="Dismiss notification"
                onClick={() => setToasts((items) => items.filter((i) => i.id !== t.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Toast.Provider>
    </Auth.Provider>
  );
}
