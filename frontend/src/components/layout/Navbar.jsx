import { Bike, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar({ theme, setTheme, user, onLogout }) {
  const location = useLocation();
  const onLanding = location.pathname === '/';

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Bike size={18} />
          </span>
          <div>
            <strong>BodaRequest</strong>
            <span>Blue-speed ride operations</span>
          </div>
        </Link>

        <nav className="topbar-nav">
          {onLanding && (
            <>
              <a href="#features">Features</a>
              <a href="#flow">Flow</a>
              <a href="#roles">Roles</a>
            </>
          )}

          {user && (
            <NavLink to="/dashboard" className="nav-pill">
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
          )}

          {!user && (
            <NavLink to="/auth" className="nav-pill">
              <LogIn size={16} />
              Sign in
            </NavLink>
          )}

          <ThemeToggle theme={theme} setTheme={setTheme} />

          {user && (
            <button type="button" className="ghost-button" onClick={onLogout}>
              <LogOut size={16} />
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
