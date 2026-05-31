import { Bike, CheckCircle2, PlayCircle, Route, TimerReset } from 'lucide-react';
import { useEffect, useState } from 'react';
import SectionCard from '../SectionCard.jsx';
import StatsCard from '../StatsCard.jsx';
import StatusBadge from '../StatusBadge.jsx';
import { createRideEventSource, ridesApi } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../services/formatters.js';

export default function RiderDashboard({ token }) {
  const [availableRides, setAvailableRides] = useState([]);
  const [assignedRides, setAssignedRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  async function loadRides() {
    const [available, assigned] = await Promise.all([
      ridesApi.available(token),
      ridesApi.assigned(token)
    ]);

    setAvailableRides(available.rides);
    setAssignedRides(assigned.rides);
  }

  useEffect(() => {
    let isMounted = true;

    loadRides().catch((loadError) => setError(loadError.message));

    const rideEvents = createRideEventSource(token);
    rideEvents.addEventListener('ride_request', () => {
      if (isMounted) {
        loadRides().catch((loadError) => setError(loadError.message));
      }
    });
    rideEvents.addEventListener('ride_status', () => {
      if (isMounted) {
        loadRides().catch((loadError) => setError(loadError.message));
      }
    });

    rideEvents.onerror = () => {
      if (isMounted) {
        setFlash('Live ride updates are reconnecting...');
      }
    };

    return () => {
      isMounted = false;
      rideEvents.close();
    };
  }, [token]);

  async function runAction(action, rideId, successMessage) {
    setLoading(true);
    setError('');
    setFlash('');

    try {
      await action(token, rideId);
      setFlash(successMessage);
      await loadRides();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setLoading(false);
    }
  }

  const activeRide = assignedRides.find((ride) => ['rider_assigned', 'in_progress'].includes(ride.rideStatus));

  return (
    <div className="dashboard-stack">
      <div className="stats-grid">
        <StatsCard icon={Route} label="Open trips" value={availableRides.length} hint="Waiting for a rider" />
        <StatsCard icon={Bike} label="Assigned to you" value={assignedRides.length} hint="Your trip history" />
        <StatsCard
          icon={TimerReset}
          label="Current ride"
          value={activeRide ? formatCurrency(activeRide.estimatedCost) : 'None'}
          hint={activeRide ? activeRide.pickupLocation : 'Accept one to begin'}
        />
      </div>

      {flash ? <p className="flash-message">{flash}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      <div className="dashboard-columns">
        <SectionCard
          title="Available requests"
          description="These paid trips are ready for a rider confirmation."
        >
          <div className="trip-list">
            {availableRides.length === 0 ? (
              <p className="muted-copy">No paid ride is waiting right now.</p>
            ) : (
              availableRides.map((ride) => (
                <article key={ride.id} className="trip-card">
                  <div className="trip-card-top">
                    <div>
                      <h4>{ride.customerName}</h4>
                      <p>{ride.pickupLocation} to {ride.destinationLocation}</p>
                    </div>
                    <StatusBadge value={ride.rideStatus} />
                  </div>
                  <div className="detail-list">
                    <span>Fare: {formatCurrency(ride.estimatedCost)}</span>
                    <span>Distance: {ride.distanceKm} km</span>
                    <span>Requested: {formatDate(ride.createdAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => runAction(ridesApi.accept, ride.id, 'Ride accepted.')}
                    disabled={loading}
                  >
                    <CheckCircle2 size={16} />
                    Confirm trip
                  </button>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="My assigned rides"
          description="Start and complete trips after you confirm them."
        >
          <div className="trip-list">
            {assignedRides.length === 0 ? (
              <p className="muted-copy">You have not accepted a ride yet.</p>
            ) : (
              assignedRides.map((ride) => (
                <article key={ride.id} className="trip-card">
                  <div className="trip-card-top">
                    <div>
                      <h4>{ride.pickupLocation} to {ride.destinationLocation}</h4>
                      <p>{ride.customerName} - {ride.customerPhone}</p>
                    </div>
                    <StatusBadge value={ride.rideStatus} />
                  </div>
                  <div className="detail-list">
                    <span>Fare: {formatCurrency(ride.estimatedCost)}</span>
                    <span>Priority: {ride.priority}</span>
                    <span>Started: {ride.startedAt ? formatDate(ride.startedAt) : 'Not yet'}</span>
                  </div>
                  <div className="inline-actions">
                    {ride.rideStatus === 'rider_assigned' ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => runAction(ridesApi.start, ride.id, 'Ride started.')}
                        disabled={loading}
                      >
                        <PlayCircle size={16} />
                        Start trip
                      </button>
                    ) : null}
                    {ride.rideStatus === 'in_progress' ? (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => runAction(ridesApi.complete, ride.id, 'Ride completed.')}
                        disabled={loading}
                      >
                        <CheckCircle2 size={16} />
                        Complete trip
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
