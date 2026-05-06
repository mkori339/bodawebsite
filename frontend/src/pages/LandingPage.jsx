import {
  ArrowRight,
  BadgeDollarSign,
  Bike,
  ChartColumn,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/layout/Navbar.jsx';

const features = [
  {
    icon: MapPinned,
    title: 'Fast ride requests',
    copy: 'Customers enter pickup, destination, timing, and ride preferences in one compact booking flow.'
  },
  {
    icon: BadgeDollarSign,
    title: 'Instant cost preview',
    copy: 'The platform calculates a transparent fare estimate before a request is published to riders.'
  },
  {
    icon: Bike,
    title: 'Rider trip board',
    copy: 'Riders view available paid requests, confirm trips, and update completion status in real time.'
  },
  {
    icon: ChartColumn,
    title: 'Admin operations',
    copy: 'Admins track daily trips, payment activity, and rider performance from one overview dashboard.'
  }
];

const flowSteps = [
  'Customer registers and logs into the platform.',
  'Customer enters route details and receives a fare quote.',
  'Customer creates the trip and completes a demo payment.',
  'Paid trip becomes available to riders for confirmation.',
  'Rider accepts, starts, and completes the trip.',
  'Admin monitors requests, payments, and rider performance.'
];

export default function LandingPage({ theme, setTheme }) {
  const { user, logout } = useAuth();

  return (
    <div className="page-shell">
      <Navbar theme={theme} setTheme={setTheme} user={user} onLogout={logout} />

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="hero-tag">
                <Sparkles size={16} />
                Boda boda booking, dispatch, and oversight
              </span>
              <h1>Blue-powered ride operations for customers, riders, and admins.</h1>
              <p>
                BodaRequest combines trip booking, fare preview, rider confirmation, and admin
                monitoring in one responsive product flow built for urban two-wheel transport.
              </p>
              <div className="hero-actions">
                <Link to={user ? '/dashboard' : '/auth'} className="primary-button">
                  {user ? 'Open dashboard' : 'Launch demo'}
                  <ArrowRight size={16} />
                </Link>
                <a href="#features" className="secondary-button">Explore features</a>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-orbit hero-orbit-a" />
              <div className="hero-orbit hero-orbit-b" />
              <article className="hero-card hero-card-main">
                <div className="hero-card-top">
                  <span>Live trip pulse</span>
                  <Clock3 size={18} />
                </div>
                <strong>Mwenge to Mlimani City</strong>
                <p>Estimated TZS 6,795 - express pickup - helmet support</p>
                <div className="hero-progress">
                  <span className="hero-progress-dot active" />
                  <span className="hero-progress-dot active" />
                  <span className="hero-progress-dot" />
                  <span className="hero-progress-dot" />
                </div>
              </article>
              <article className="hero-card hero-card-side">
                <div className="metric-bubble">
                  <ShieldCheck size={16} />
                  <span>Admin visibility</span>
                </div>
                <h3>Trips, payments, and rider readiness in one view.</h3>
                <p>Responsive cards, role-based screens, and a dark theme included.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="features" className="section-block">
          <div className="container">
            <div className="section-heading">
              <span>Platform features</span>
              <h2>One product flow, three operating views.</h2>
            </div>
            <div className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article key={feature.title} className="feature-card">
                    <div className="feature-icon">
                      <Icon size={20} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="flow" className="section-block">
          <div className="container split-panel">
            <div className="section-heading left-aligned">
              <span>Operating flow</span>
              <h2>Simple movement from request to completion.</h2>
              <p>
                The system keeps the rider handoff clear: request, pay, publish, confirm, move, and
                report.
              </p>
            </div>

            <div className="flow-list">
              {flowSteps.map((step, index) => (
                <div key={step} className="flow-item">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="section-block">
          <div className="container role-grid">
            <article className="role-card">
              <h3>Customers</h3>
              <p>Create requests, see the ride cost, pay through a demo flow, and track the assigned boda.</p>
            </article>
            <article className="role-card">
              <h3>Riders</h3>
              <p>Receive paid requests, confirm trips, start rides, and complete deliveries from one board.</p>
            </article>
            <article className="role-card">
              <h3>Admins</h3>
              <p>Track daily trips, payment records, and rider performance with operational summaries.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
