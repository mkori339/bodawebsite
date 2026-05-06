import { ShieldCheck } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import AdminDashboard from '../components/dashboards/AdminDashboard.jsx';
import CustomerDashboard from '../components/dashboards/CustomerDashboard.jsx';
import RiderDashboard from '../components/dashboards/RiderDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage({ theme, setTheme }) {
  const { user, token, logout } = useAuth();

  return (
    <div className="page-shell">
      <Navbar theme={theme} setTheme={setTheme} user={user} onLogout={logout} />

      <main className="container dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-tag">
              <ShieldCheck size={16} />
              {user.role} workspace
            </span>
            <h1>Welcome back, {user.fullName}.</h1>
            <p>
              {user.role === 'customer' && 'Book a ride, review the fare, and track rider confirmation.'}
              {user.role === 'rider' && 'Watch paid requests, claim trips, and update ride progress.'}
              {user.role === 'admin' && 'Track live operations, revenue activity, and rider performance.'}
            </p>
          </div>
        </section>

        {user.role === 'customer' ? <CustomerDashboard token={token} /> : null}
        {user.role === 'rider' ? <RiderDashboard token={token} /> : null}
        {user.role === 'admin' ? <AdminDashboard token={token} /> : null}
      </main>
    </div>
  );
}
