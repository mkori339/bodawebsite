import { query } from '../config/db.js';

function mapRide(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    riderName: row.rider_name,
    pickupLocation: row.pickup_location,
    destinationLocation: row.destination_location,
    estimatedCost: Number(row.estimated_cost),
    paymentStatus: row.payment_status,
    rideStatus: row.ride_status,
    priority: row.priority,
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

function mapRider(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    currentZone: row.current_zone,
    bikePlate: row.bike_plate,
    rating: Number(row.rating),
    completedTrips: row.completed_trips,
    totalEarnings: Number(row.total_earnings),
    isAvailable: Boolean(row.is_available)
  };
}

export async function getOverview(req, res, next) {
  try {
    const [
      tripStatsRows,
      userStatsRows,
      recentTripRows,
      paymentTrendRows,
      riderRows
    ] = await Promise.all([
      query(
        `
          SELECT
            COUNT(*) AS total_trips,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_trips,
            SUM(CASE WHEN ride_status = 'completed' THEN 1 ELSE 0 END) AS completed_trips,
            SUM(CASE WHEN ride_status IN ('waiting_rider', 'rider_assigned', 'in_progress') THEN 1 ELSE 0 END) AS active_trips,
            COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND payment_status = 'paid' THEN estimated_cost ELSE 0 END), 0) AS today_revenue
          FROM ride_requests
        `
      ),
      query(
        `
          SELECT
            SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) AS customers,
            SUM(CASE WHEN role = 'rider' THEN 1 ELSE 0 END) AS riders,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
          FROM users
        `
      ),
      query(
        `
          SELECT
            rr.*,
            c.full_name AS customer_name,
            r.full_name AS rider_name
          FROM ride_requests rr
          JOIN users c ON c.id = rr.customer_id
          LEFT JOIN users r ON r.id = rr.rider_id
          ORDER BY rr.created_at DESC
          LIMIT 8
        `
      ),
      query(
        `
          SELECT
            DATE(paid_at) AS payment_day,
            COUNT(*) AS payment_count,
            COALESCE(SUM(amount), 0) AS total_amount
          FROM payments
          WHERE paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          GROUP BY DATE(paid_at)
          ORDER BY payment_day ASC
        `
      ),
      query(
        `
          SELECT
            u.id,
            u.full_name,
            u.phone,
            rp.current_zone,
            rp.bike_plate,
            rp.rating,
            rp.completed_trips,
            rp.total_earnings,
            rp.is_available
          FROM rider_profiles rp
          JOIN users u ON u.id = rp.user_id
          ORDER BY rp.completed_trips DESC, rp.total_earnings DESC
          LIMIT 6
        `
      )
    ]);

    const tripStats = tripStatsRows[0] || {};
    const userStats = userStatsRows[0] || {};

    return res.json({
      stats: {
        totalTrips: Number(tripStats.total_trips || 0),
        todayTrips: Number(tripStats.today_trips || 0),
        completedTrips: Number(tripStats.completed_trips || 0),
        activeTrips: Number(tripStats.active_trips || 0),
        todayRevenue: Number(tripStats.today_revenue || 0),
        customers: Number(userStats.customers || 0),
        riders: Number(userStats.riders || 0),
        admins: Number(userStats.admins || 0)
      },
      recentTrips: recentTripRows.map(mapRide),
      paymentTrend: paymentTrendRows.map((row) => ({
        day: row.payment_day,
        paymentCount: Number(row.payment_count),
        totalAmount: Number(row.total_amount)
      })),
      topRiders: riderRows.map(mapRider)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTrips(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          rr.*,
          c.full_name AS customer_name,
          r.full_name AS rider_name
        FROM ride_requests rr
        JOIN users c ON c.id = rr.customer_id
        LEFT JOIN users r ON r.id = rr.rider_id
        ORDER BY rr.created_at DESC
        LIMIT 50
      `
    );

    return res.json({ trips: rows.map(mapRide) });
  } catch (error) {
    return next(error);
  }
}

export async function getPayments(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          p.id,
          p.amount,
          p.method,
          p.transaction_ref,
          p.payment_status,
          p.paid_at,
          rr.id AS ride_id,
          c.full_name AS customer_name,
          r.full_name AS rider_name
        FROM payments p
        JOIN ride_requests rr ON rr.id = p.ride_id
        JOIN users c ON c.id = p.customer_id
        LEFT JOIN users r ON r.id = rr.rider_id
        ORDER BY p.paid_at DESC
        LIMIT 50
      `
    );

    return res.json({
      payments: rows.map((row) => ({
        id: row.id,
        rideId: row.ride_id,
        customerName: row.customer_name,
        riderName: row.rider_name,
        amount: Number(row.amount),
        method: row.method,
        transactionRef: row.transaction_ref,
        paymentStatus: row.payment_status,
        paidAt: row.paid_at
      }))
    });
  } catch (error) {
    return next(error);
  }
}

export async function getRiders(req, res, next) {
  try {
    const rows = await query(
      `
        SELECT
          u.id,
          u.full_name,
          u.phone,
          rp.current_zone,
          rp.bike_plate,
          rp.rating,
          rp.completed_trips,
          rp.total_earnings,
          rp.is_available
        FROM rider_profiles rp
        JOIN users u ON u.id = rp.user_id
        ORDER BY rp.completed_trips DESC, rp.total_earnings DESC
      `
    );

    return res.json({ riders: rows.map(mapRider) });
  } catch (error) {
    return next(error);
  }
}
