import { LockKeyhole, ShieldEllipsis, UserRoundPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialRegisterForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
  bikePlate: '',
  currentZone: ''
};

export default function AuthPage({ theme, setTheme }) {
  const navigate = useNavigate();
  const { user, login, register, loading, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(() => ({ ...initialRegisterForm }));
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await login(loginForm);
      } else {
        await register(registerForm);
      }

      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="page-shell">
      <Navbar theme={theme} setTheme={setTheme} user={user} onLogout={logout} />

      <main className="auth-layout container">
        <section className="auth-panel intro-panel">
          <span className="hero-tag">
            <ShieldEllipsis size={16} />
            Role-based demo access
          </span>
          <h1>Enter the platform from the role you want to test.</h1>
          <p>
            For this prototype, you can register directly as a customer, rider, or admin so the full
            workflow can be demonstrated quickly.
          </p>
          <div className="detail-list">
            <span>Customer: request rides and pay demo fares</span>
            <span>Rider: confirm and complete paid trips</span>
            <span>Admin: monitor performance and daily operations</span>
          </div>
          <Link to="/" className="secondary-button">Back to landing page</Link>
        </section>

        <section className="auth-panel form-panel">
          <div className="auth-switch">
            <button
              type="button"
              className={mode === 'login' ? 'tab-button active' : 'tab-button'}
              onClick={() => setMode('login')}
            >
              <LockKeyhole size={16} />
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'tab-button active' : 'tab-button'}
              onClick={() => setMode('register')}
            >
              <UserRoundPlus size={16} />
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'login' ? (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="********"
                    required
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Full name
                  <input
                    value={registerForm.fullName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Asha Mushi"
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="asha@example.com"
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={registerForm.phone}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+255 700 000 000"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Create a password"
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={registerForm.role}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="customer">Customer</option>
                    <option value="rider">Rider</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                {registerForm.role === 'rider' ? (
                  <>
                    <label>
                      Bike plate
                      <input
                        value={registerForm.bikePlate}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, bikePlate: event.target.value }))}
                        placeholder="MC 456 TZA"
                      />
                    </label>
                    <label>
                      Current zone
                      <input
                        value={registerForm.currentZone}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, currentZone: event.target.value }))}
                        placeholder="Posta"
                      />
                    </label>
                  </>
                ) : null}
              </>
            )}

            {error ? <p className="error-message">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
