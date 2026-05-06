import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

function getInitialTheme() {
  const savedTheme = localStorage.getItem('boda_theme');

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, token, user } = useAuth();

  if (token && !user) {
    return <div className="route-loading">Restoring your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('boda_theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} setTheme={setTheme} />} />
      <Route path="/auth" element={<AuthPage theme={theme} setTheme={setTheme} />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardPage theme={theme} setTheme={setTheme} />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}
