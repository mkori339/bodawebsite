import { query } from '../config/db.js';
import { calculateQuote } from '../utils/quoteCalculator.js';

function mapRide(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    riderId: row.rider_id,
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
    pickupLocation: row.pickup_location,
    destinationLocation: row.destination_location,
    pickupNote: row.pickup_note,
    destinationNote: row.destination_note,
    requestedPickupTime: row.requested_pickup_time,
    distanceKm: Number(row.distance_km),
    estimatedCost: Number(row.estimated_cost),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    rideStatus: row.ride_status,
    priority: row.priority,
    passengerCount: row.passenger_count,
    helmetRequired: Boolean(row.helmet_required),
    notes: row.notes,
    acceptedAt: row.accepted_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getRideById(rideId) {
  const rows = await query(
    `
      SELECT
        rr.*,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        r.full_name AS rider_name,
        r.phone AS rider_phone
      FROM ride_requests rr
      JOIN users c ON c.id = rr.customer_id
      LEFT JOIN users r ON r.id = rr.rider_id
      WHERE rr.id = ?
      LIMIT 1
    `,
    [rideId]
  );

  return rows[0] || null;
}

function buildRidePayload(body) {
  const normalizedPickupTime = body.requestedPickupTime
    ? String(body.requestedPickupTime).replace('T', ' ')
    : null;

  return {
    pickupLocation: body.pickupLocation,
    destinationLocation: body.destinationLocation,
    pickupNote: body.pickupNote || null,
    destinationNote: body.destinationNote || null,
    requestedPickupTime: normalizedPickupTime,
    distanceKm: Number(body.distanceKm),
    paymentMethod: body.paymentMethod || 'demo_wallet',
    priority: body.priority || 'standard',
    passengerCount: Number(body.passengerCount || 1),
    helmetRequired: Boolean(body.helmetRequired),
    notes: body.notes || null
  };
}

export async function quoteRide(req, res, next) {
  try {
    const payload = buildRidePayload(req.body);

    if (!payload.pickupLocation || !payload.destinationLocation) {
      return res.status(400).json({ message: 'Pickup and destination are required.' });
    }

    const quote = calculateQuote(payload);
    return res.json({ quote });
  } catch (error) {
    return next(error);
  }
}

export async function createRide(req, res, next) {
  try {
    const payload = buildRidePayload(req.body);

    if (!payload.pickupLocation || !payload.destinationLocation) {
      return res.status(400).json({ message: 'Pickup and destination are required.' });
    }

    const quote = calculateQuote(payload);
    const result = await query(
      `
        INSERT INTO ride_requests (
          customer_id,
          pickup_location,
          destination_location,
          pickup_note,
          destination_note,
          requested_pickup_time,
          distance_km,
          estimated_cost,
          payment_method,
          payment_status,
          ride_status,
          priority,
          passenger_count,
          helmet_required,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending_payment', ?, ?, ?, ?)
      `,
      [
        req.user.id,
        payload.pickupLocation,
        payload.destinationLocation,
        payload.pickupNote,
        payload.destinationNote,
        payload.requestedPickupTime,
        payload.distanceKm,
        quote.total,
        payload.paymentMethod,
        payload.priority,
        payload.passengerCount,
        payload.helmetRequired ? 1 : 0,
        payload.notes
      ]
    );

    const ride = await getRideById(result.insertId);

    return res.status(201).json({
      message: 'Ride created. Payment is still pending.',
      quote,
      ride: mapRide(ride)
    });
  } catch (error) {
    return next(error);
  }
}

export async function payForRide(req, res, next) {
  try {
    const rideId = Number(req.params.rideId);
    const ride = await getRideById(rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    if (ride.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only pay for your own ride.' });
    }

    if (ride.payment_status === 'paid') {
      return res.status(409).json({ message: 'This ride has already been paid.' });
    }

    const transactionRef = `DEMO-${rideId}-${Date.now()}`;

    await query(
      `
        INSERT INTO payments (ride_id, customer_id, amount, method, transaction_ref, payment_status, paid_at)
        VALUES (?, ?, ?, ?, ?, 'successful', NOW())
      `,
      [ride.id, ride.customer_id, ride.estimated_cost, ride.payment_method, transactionRef]
    );

    await query(
      `
        UPDATE ride_requests
        SET payment_status = 'paid', ride_status = 'waiting_rider', updated_at = NOW()
        WHERE id = ?
      `,
      [ride.id]
    );

    const updatedRide = await getRideById(ride.id);

    return res.json({
      message: 'Demo payment completed.',
      payment: {
        transactionRef,
        amount: Number(ride.estimated_cost),
        method: ride.payment_method
      },
      ride: mapRide(updatedRide)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCustomerRides(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          rr.*,
          c.full_name AS customer_name,
          c.phone AS customer_phone,
          r.full_name AS rider_name,
          r.phone AS rider_phone
        FROM ride_requests rr
        JOIN users c ON c.id = rr.customer_id
        LEFT JOIN users r ON r.id = rr.rider_id
        WHERE rr.customer_id = ?
        ORDER BY rr.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ rides: rows.map(mapRide) });
  } catch (error) {
    return next(error);
  }
}

export async function getAvailableRides(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          rr.*,
          c.full_name AS customer_name,
          c.phone AS customer_phone,
          NULL AS rider_name,
          NULL AS rider_phone
        FROM ride_requests rr
        JOIN users c ON c.id = rr.customer_id
        WHERE rr.ride_status = 'waiting_rider'
        ORDER BY rr.created_at ASC
      `
    );

    return res.json({ rides: rows.map(mapRide) });
  } catch (error) {
    return next(error);
  }
}

export async function getAssignedRides(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          rr.*,
          c.full_name AS customer_name,
          c.phone AS customer_phone,
          r.full_name AS rider_name,
          r.phone AS rider_phone
        FROM ride_requests rr
        JOIN users c ON c.id = rr.customer_id
        LEFT JOIN users r ON r.id = rr.rider_id
        WHERE rr.rider_id = ?
        ORDER BY rr.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ rides: rows.map(mapRide) });
  } catch (error) {
    return next(error);
  }
}

export async function acceptRide(req, res, next) {
  try {
    const rideId = Number(req.params.rideId);
    const riderProfile = await query('SELECT user_id FROM rider_profiles WHERE user_id = ? LIMIT 1', [req.user.id]);

    if (riderProfile.length === 0) {
      return res.status(400).json({ message: 'Rider profile is missing. Register as a rider first.' });
    }

    const activeAssignments = await query(
      `
        SELECT id
        FROM ride_requests
        WHERE rider_id = ? AND ride_status IN ('rider_assigned', 'in_progress')
        LIMIT 1
      `,
      [req.user.id]
    );

    if (activeAssignments.length > 0) {
      return res.status(409).json({ message: 'Finish the current assigned ride before accepting a new one.' });
    }

    const result = await query(
      `
        UPDATE ride_requests
        SET rider_id = ?, ride_status = 'rider_assigned', accepted_at = NOW(), updated_at = NOW()
        WHERE id = ? AND ride_status = 'waiting_rider'
      `,
      [req.user.id, rideId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'This ride is no longer available.' });
    }

    await query('UPDATE rider_profiles SET is_available = 0 WHERE user_id = ?', [req.user.id]);

    const ride = await getRideById(rideId);

    return res.json({
      message: 'Ride accepted.',
      ride: mapRide(ride)
    });
  } catch (error) {
    return next(error);
  }
}

export async function startRide(req, res, next) {
  try {
    const rideId = Number(req.params.rideId);
    const result = await query(
      `
        UPDATE ride_requests
        SET ride_status = 'in_progress', started_at = NOW(), updated_at = NOW()
        WHERE id = ? AND rider_id = ? AND ride_status = 'rider_assigned'
      `,
      [rideId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'This ride cannot be started now.' });
    }

    const ride = await getRideById(rideId);

    return res.json({
      message: 'Ride started.',
      ride: mapRide(ride)
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeRide(req, res, next) {
  try {
    const rideId = Number(req.params.rideId);
    const ride = await getRideById(rideId);

    if (!ride || ride.rider_id !== req.user.id) {
      return res.status(404).json({ message: 'Ride not found for this rider.' });
    }

    if (ride.ride_status !== 'in_progress') {
      return res.status(409).json({ message: 'Only rides in progress can be completed.' });
    }

    await query(
      `
        UPDATE ride_requests
        SET ride_status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [rideId]
    );

    await query(
      `
        UPDATE rider_profiles
        SET
          is_available = 1,
          completed_trips = completed_trips + 1,
          total_earnings = total_earnings + ?
        WHERE user_id = ?
      `,
      [ride.estimated_cost, req.user.id]
    );

    const updatedRide = await getRideById(rideId);

    return res.json({
      message: 'Ride completed successfully.',
      ride: mapRide(updatedRide)
    });
  } catch (error) {
    return next(error);
  }
}
