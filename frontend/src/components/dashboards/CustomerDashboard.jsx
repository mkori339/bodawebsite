import { CreditCard, MapPinned, Send, Sparkles, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import RideTimeline from '../RideTimeline.jsx';
import SectionCard from '../SectionCard.jsx';
import StatsCard from '../StatsCard.jsx';
import StatusBadge from '../StatusBadge.jsx';
import { createRideEventSource, ridesApi } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../services/formatters.js';

const initialRideForm = {
  pickupLocation: '',
  destinationLocation: '',
  pickupNote: '',
  destinationNote: '',
  requestedPickupTime: '',
  distanceKm: 4,
  passengerCount: 1,
  priority: 'standard',
  paymentMethod: 'demo_wallet',
  helmetRequired: false,
  notes: ''
};

export default function CustomerDashboard({ token }) {
  const [rides, setRides] = useState([]);
  const [quote, setQuote] = useState(null);
  const [rideForm, setRideForm] = useState(() => ({ ...initialRideForm }));
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  async function loadRides() {
    const data = await ridesApi.mine(token);
    setRides(data.rides);
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

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setRideForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
    setQuote(null);
    setFlash('');
    setError('');
  }

  async function handleEstimate(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setFlash('');

    try {
      const data = await ridesApi.quote(token, {
        ...rideForm,
        distanceKm: Number(rideForm.distanceKm),
        passengerCount: Number(rideForm.passengerCount)
      });
      setQuote(data.quote);
      setFlash('Fare estimate updated.');
    } catch (estimateError) {
      setError(estimateError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRide() {
    setLoading(true);
    setError('');
    setFlash('');

    try {
      const data = await ridesApi.create(token, {
        ...rideForm,
        distanceKm: Number(rideForm.distanceKm),
        passengerCount: Number(rideForm.passengerCount)
      });
      setQuote(data.quote);
      setRideForm({ ...initialRideForm });
      setFlash('Ride created. Complete the demo payment to publish it to riders.');
      await loadRides();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(rideId) {
    setLoading(true);
    setError('');
    setFlash('');

    try {
      await ridesApi.pay(token, rideId);
      setFlash('Payment accepted. Riders can now see your trip.');
      await loadRides();
    } catch (payError) {
      setError(payError.message);
    } finally {
      setLoading(false);
    }
  }

  const latestRide = rides[0];
  const paidRides = rides.filter((ride) => ride.paymentStatus === 'paid').length;

  return (
    <div className="dashboard-stack">
      <div className="stats-grid">
        <StatsCard icon={Ticket} label="Total requests" value={rides.length} hint="All your ride entries" />
        <StatsCard icon={CreditCard} label="Paid rides" value={paidRides} hint="Ready or completed trips" />
        <StatsCard
          icon={MapPinned}
          label="Latest quote"
          value={quote ? formatCurrency(quote.total) : 'Estimate first'}
          hint="Calculated from your route"
        />
      </div>

      <div className="dashboard-columns">
        <SectionCard
          className="wide-card"
          title="Request a boda"
          description="Capture trip details, estimate the cost, then publish the ride after a demo payment."
        >
          <form className="ride-form" onSubmit={handleEstimate}>
            <div className="form-grid">
              <label>
                Pickup
                <input
                  name="pickupLocation"
                  value={rideForm.pickupLocation}
                  onChange={updateField}
                  placeholder="Mwenge Bus Stand"
                  required
                />
              </label>
              <label>
                Destination
                <input
                  name="destinationLocation"
                  value={rideForm.destinationLocation}
                  onChange={updateField}
                  placeholder="Mlimani City"
                  required
                />
              </label>
              <label>
                Pickup note
                <input
                  name="pickupNote"
                  value={rideForm.pickupNote}
                  onChange={updateField}
                  placeholder="Near the blue gate"
                />
              </label>
              <label>
                Destination note
                <input
                  name="destinationNote"
                  value={rideForm.destinationNote}
                  onChange={updateField}
                  placeholder="Security gate two"
                />
              </label>
              <label>
                Distance (km)
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  name="distanceKm"
                  value={rideForm.distanceKm}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Passengers
                <input
                  type="number"
                  min="1"
                  max="2"
                  name="passengerCount"
                  value={rideForm.passengerCount}
                  onChange={updateField}
                />
              </label>
              <label>
                Priority
                <select name="priority" value={rideForm.priority} onChange={updateField}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>
              <label>
                Pickup time
                <input
                  type="datetime-local"
                  name="requestedPickupTime"
                  value={rideForm.requestedPickupTime}
                  onChange={updateField}
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="helmetRequired"
                checked={rideForm.helmetRequired}
                onChange={updateField}
              />
              Need rider helmet support
            </label>

            <label>
              Extra notes
              <textarea
                name="notes"
                value={rideForm.notes}
                onChange={updateField}
                placeholder="Any short trip instructions for the rider."
              />
            </label>

            <div className="inline-actions">
              <button type="submit" className="primary-button" disabled={loading}>
                <Sparkles size={16} />
                {loading ? 'Calculating...' : 'Estimate fare'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCreateRide}
                disabled={loading || !quote}
              >
                <Send size={16} />
                Create trip
              </button>
            </div>

            {flash ? <p className="flash-message">{flash}</p> : null}
            {error ? <p className="error-message">{error}</p> : null}
          </form>

          {quote ? (
            <div className="quote-panel">
              <div>
                <span>Base</span>
                <strong>{formatCurrency(quote.baseFare)}</strong>
              </div>
              <div>
                <span>Distance</span>
                <strong>{formatCurrency(quote.distanceCharge)}</strong>
              </div>
              <div>
                <span>Service fee</span>
                <strong>{formatCurrency(quote.serviceFee)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(quote.total)}</strong>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Live ride board"
          description="Follow the latest ride from payment through rider arrival and completion."
        >
          {latestRide ? (
            <>
              <div className="ride-summary">
                <div>
                  <h4>{latestRide.pickupLocation}</h4>
                  <p>to {latestRide.destinationLocation}</p>
                </div>
                <StatusBadge value={latestRide.rideStatus} />
              </div>
              <RideTimeline status={latestRide.rideStatus} />
              <div className="detail-list">
                <span>Fare: {formatCurrency(latestRide.estimatedCost)}</span>
                <span>Created: {formatDate(latestRide.createdAt)}</span>
                <span>Rider: {latestRide.riderName || 'Waiting for assignment'}</span>
              </div>
              {latestRide.rideStatus === 'pending_payment' ? (
                <button type="button" className="primary-button" onClick={() => handlePay(latestRide.id)} disabled={loading}>
                  <CreditCard size={16} />
                  Pay demo fare
                </button>
              ) : null}
            </>
          ) : (
            <p className="muted-copy">No ride yet. Estimate a fare and create your first trip.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent ride requests"
        description="Every request stays visible here with the current payment and assignment state."
      >
        <div className="trip-list">
          {rides.length === 0 ? (
            <p className="muted-copy">Your ride list will appear here after the first request.</p>
          ) : (
            rides.map((ride) => (
              <article key={ride.id} className="trip-card">
                <div className="trip-card-top">
                  <div>
                    <h4>{ride.pickupLocation} to {ride.destinationLocation}</h4>
                    <p>{formatDate(ride.createdAt)}</p>
                  </div>
                  <StatusBadge value={ride.rideStatus} />
                </div>
                <div className="detail-list">
                  <span>Fare: {formatCurrency(ride.estimatedCost)}</span>
                  <span>Payment: {ride.paymentStatus}</span>
                  <span>Priority: {ride.priority}</span>
                  <span>Rider: {ride.riderName || 'Unassigned'}</span>
                </div>
                {ride.rideStatus === 'pending_payment' ? (
                  <button type="button" className="secondary-button" onClick={() => handlePay(ride.id)} disabled={loading}>
                    Pay and publish ride
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
