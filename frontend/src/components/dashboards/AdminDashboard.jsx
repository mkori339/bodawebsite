import { Coins, Route, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import SectionCard from '../SectionCard.jsx';
import StatsCard from '../StatsCard.jsx';
import StatusBadge from '../StatusBadge.jsx';
import { adminApi } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../services/formatters.js';

export default function AdminDashboard({ token }) {
  const [overview, setOverview] = useState(null);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [riders, setRiders] = useState([]);
  const [error, setError] = useState('');

  async function loadDashboard() {
    const [overviewData, tripsData, paymentsData, ridersData] = await Promise.all([
      adminApi.overview(token),
      adminApi.trips(token),
      adminApi.payments(token),
      adminApi.riders(token)
    ]);

    setOverview(overviewData);
    setTrips(tripsData.trips);
    setPayments(paymentsData.payments);
    setRiders(ridersData.riders);
  }

  useEffect(() => {
    loadDashboard().catch((loadError) => setError(loadError.message));
  }, [token]);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="dashboard-stack">
      <div className="stats-grid">
        <StatsCard icon={Route} label="Trips today" value={overview?.stats.todayTrips || 0} hint="Requests created today" />
        <StatsCard
          icon={Coins}
          label="Revenue today"
          value={formatCurrency(overview?.stats.todayRevenue || 0)}
          hint="Successful demo payments"
        />
        <StatsCard icon={Users} label="Registered riders" value={overview?.stats.riders || 0} hint="Total rider accounts" />
        <StatsCard icon={ShieldCheck} label="Active trips" value={overview?.stats.activeTrips || 0} hint="Waiting, assigned, or moving" />
      </div>

      <div className="dashboard-columns">
        <SectionCard
          className="wide-card"
          title="Recent trip operations"
          description="Admin visibility into customer demand, rider assignment, and ride completion."
        >
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Rider</th>
                  <th>Route</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.customerName}</td>
                    <td>{trip.riderName || 'Unassigned'}</td>
                    <td>{trip.pickupLocation} to {trip.destinationLocation}</td>
                    <td>{formatCurrency(trip.estimatedCost)}</td>
                    <td><StatusBadge value={trip.rideStatus} /></td>
                    <td>{formatDate(trip.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Payment stream" description="Demo transactions recorded after customer checkout.">
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Ride</th>
                  <th>Customer</th>
                  <th>Rider</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.rideId}</td>
                    <td>{payment.customerName}</td>
                    <td>{payment.riderName || 'Pending'}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.transactionRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-columns">
        <SectionCard title="Rider performance" description="Trips completed, zone coverage, earnings, and readiness.">
          <div className="trip-list">
            {riders.map((rider) => (
              <article key={rider.id} className="trip-card">
                <div className="trip-card-top">
                  <div>
                    <h4>{rider.fullName}</h4>
                    <p>{rider.currentZone} - {rider.bikePlate}</p>
                  </div>
                  <StatusBadge value={rider.isAvailable ? 'available' : 'busy'} />
                </div>
                <div className="detail-list">
                  <span>Trips: {rider.completedTrips}</span>
                  <span>Earnings: {formatCurrency(rider.totalEarnings)}</span>
                  <span>Rating: {rider.rating.toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="7-day payment pulse" description="A simple trend panel for quick revenue checks.">
          <div className="mini-chart">
            {overview?.paymentTrend?.length ? (
              overview.paymentTrend.map((entry) => (
                <div key={entry.day} className="chart-bar-group">
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.max(18, entry.totalAmount / 300)}px` }}
                    title={`${entry.day} - ${formatCurrency(entry.totalAmount)}`}
                  />
                  <span>{String(entry.day).slice(5)}</span>
                </div>
              ))
            ) : (
              <p className="muted-copy">Payments will appear here after the first completed checkout.</p>
            )}
          </div>
          <div className="detail-list">
            <span>Total completed trips: {overview?.stats.completedTrips || 0}</span>
            <span>Total platform trips: {overview?.stats.totalTrips || 0}</span>
            <span>Admins: {overview?.stats.admins || 0}</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
