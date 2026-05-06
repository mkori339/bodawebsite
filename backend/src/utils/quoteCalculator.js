const BASE_FARE = 1500;
const PER_KILOMETER = 900;
const EXTRA_PASSENGER_FARE = 300;
const HELMET_SURCHARGE = 500;

const PRIORITY_MULTIPLIERS = {
  standard: 1,
  express: 1.15,
  scheduled: 1.05
};

export function calculateQuote({
  distanceKm,
  passengerCount = 1,
  helmetRequired = false,
  priority = 'standard'
}) {
  const safeDistance = Number(distanceKm);
  const safePassengers = Number(passengerCount);

  if (Number.isNaN(safeDistance) || safeDistance <= 0) {
    const error = new Error('Distance must be greater than zero.');
    error.status = 400;
    throw error;
  }

  if (Number.isNaN(safePassengers) || safePassengers < 1) {
    const error = new Error('Passenger count must be at least 1.');
    error.status = 400;
    throw error;
  }

  const passengerCharge = Math.max(0, safePassengers - 1) * EXTRA_PASSENGER_FARE;
  const helmetCharge = helmetRequired ? HELMET_SURCHARGE : 0;
  const distanceCharge = Math.round(safeDistance * PER_KILOMETER);
  const multiplier = PRIORITY_MULTIPLIERS[priority] || PRIORITY_MULTIPLIERS.standard;
  const subtotal = BASE_FARE + distanceCharge + passengerCharge + helmetCharge;
  const serviceFee = Math.round(subtotal * 0.07);
  const total = Math.round((subtotal + serviceFee) * multiplier);

  return {
    currency: 'TZS',
    baseFare: BASE_FARE,
    distanceCharge,
    passengerCharge,
    helmetCharge,
    serviceFee,
    priority,
    total
  };
}
