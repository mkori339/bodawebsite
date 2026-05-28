import client from 'prom-client';
import { query } from '../config/db.js';

const register = new client.Registry();
const BUSINESS_METRICS_CACHE_MS = Number(process.env.BUSINESS_METRICS_CACHE_MS || 15000);
const USER_ROLES = ['all', 'customer', 'rider', 'admin'];
const RIDE_STATUSES = ['all', 'active', 'pending_payment', 'waiting_rider', 'rider_assigned', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['all', 'successful', 'failed', 'reversed'];
const REVENUE_WINDOWS = ['all_time', 'today', 'last_7_days'];
const RIDER_AVAILABILITY_STATES = ['all', 'available', 'unavailable'];
const ACTIVE_RIDE_STATUSES = new Set(['waiting_rider', 'rider_assigned', 'in_progress']);

client.collectDefaultMetrics({
  prefix: 'bodarequest_nodejs_',
  register
});

const httpRequestsInFlight = new client.Gauge({
  name: 'bodarequest_http_requests_in_flight',
  help: 'Current number of in-flight HTTP requests',
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'bodarequest_http_requests_total',
  help: 'Total number of completed HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestErrorsTotal = new client.Counter({
  name: 'bodarequest_http_request_errors_total',
  help: 'Total number of completed HTTP requests with 4xx or 5xx responses',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDurationMs = new client.Histogram({
  name: 'bodarequest_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000],
  registers: [register]
});

const usersCount = new client.Gauge({
  name: 'bodarequest_users_count',
  help: 'Current number of users grouped by role',
  labelNames: ['role'],
  registers: [register]
});

const ridesCount = new client.Gauge({
  name: 'bodarequest_rides_count',
  help: 'Current number of ride requests grouped by lifecycle status',
  labelNames: ['status'],
  registers: [register]
});

const paymentsCount = new client.Gauge({
  name: 'bodarequest_payments_count',
  help: 'Current number of payments grouped by payment status',
  labelNames: ['status'],
  registers: [register]
});

const revenueAmount = new client.Gauge({
  name: 'bodarequest_revenue_amount',
  help: 'Current revenue totals derived from successful payments',
  labelNames: ['window'],
  registers: [register]
});

const riderAvailabilityCount = new client.Gauge({
  name: 'bodarequest_rider_availability_count',
  help: 'Current number of rider profiles grouped by availability',
  labelNames: ['availability'],
  registers: [register]
});

const businessMetricsUp = new client.Gauge({
  name: 'bodarequest_business_metrics_up',
  help: 'Whether the latest business metrics refresh from MySQL succeeded',
  registers: [register]
});

const businessMetricsLastRefreshTimestampSeconds = new client.Gauge({
  name: 'bodarequest_business_metrics_last_refresh_timestamp_seconds',
  help: 'Unix timestamp of the last successful business metrics refresh',
  registers: [register]
});

const businessMetricsCache = {
  expiresAt: 0,
  inFlight: null
};

function sanitizeRoutePath(path = '') {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(\b|\/)/g, '/:id$1')
    .replace(/\/[0-9a-f]{24}(\b|\/)/gi, '/:id$1');
}

function getRouteLabel(req) {
  if (req.route?.path) {
    const routePath = Array.isArray(req.route.path) ? req.route.path[0] : req.route.path;
    return `${req.baseUrl || ''}${routePath}`;
  }

  const path = req.path || req.originalUrl || 'unmatched';
  return sanitizeRoutePath(path.split('?')[0]) || 'unmatched';
}

function numberValue(value) {
  return Number(value || 0);
}

function setGaugeSeries(gauge, labels, valuesByLabel = {}) {
  for (const label of labels) {
    gauge.labels(label).set(numberValue(valuesByLabel[label]));
  }
}

function initializeBusinessMetrics() {
  setGaugeSeries(usersCount, USER_ROLES);
  setGaugeSeries(ridesCount, RIDE_STATUSES);
  setGaugeSeries(paymentsCount, PAYMENT_STATUSES);
  setGaugeSeries(revenueAmount, REVENUE_WINDOWS);
  setGaugeSeries(riderAvailabilityCount, RIDER_AVAILABILITY_STATES);
  businessMetricsUp.set(0);
  businessMetricsLastRefreshTimestampSeconds.set(0);
}

async function refreshBusinessMetrics() {
  const now = Date.now();

  if (now < businessMetricsCache.expiresAt) {
    return;
  }

  if (businessMetricsCache.inFlight) {
    return businessMetricsCache.inFlight;
  }

  businessMetricsCache.inFlight = (async () => {
    try {
      const [
        userRows,
        rideRows,
        paymentRows,
        revenueRows,
        riderAvailabilityRows
      ] = await Promise.all([
        query(`
          SELECT role, COUNT(*) AS total
          FROM users
          GROUP BY role
        `),
        query(`
          SELECT ride_status AS status, COUNT(*) AS total
          FROM ride_requests
          GROUP BY ride_status
        `),
        query(`
          SELECT payment_status AS status, COUNT(*) AS total
          FROM payments
          GROUP BY payment_status
        `),
        query(`
          SELECT
            COALESCE(SUM(CASE WHEN payment_status = 'successful' THEN amount ELSE 0 END), 0) AS all_time_revenue,
            COALESCE(SUM(CASE WHEN payment_status = 'successful' AND DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) AS today_revenue,
            COALESCE(SUM(CASE WHEN payment_status = 'successful' AND paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN amount ELSE 0 END), 0) AS last_7_days_revenue
          FROM payments
        `),
        query(`
          SELECT
            COALESCE(SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END), 0) AS available_riders,
            COALESCE(SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END), 0) AS unavailable_riders
          FROM rider_profiles
        `)
      ]);

      const usersByRole = Object.fromEntries(
        userRows.map((row) => [row.role, numberValue(row.total)])
      );
      const ridesByStatus = Object.fromEntries(
        rideRows.map((row) => [row.status, numberValue(row.total)])
      );
      const paymentsByStatus = Object.fromEntries(
        paymentRows.map((row) => [row.status, numberValue(row.total)])
      );

      usersByRole.all = USER_ROLES
        .filter((role) => role !== 'all')
        .reduce((sum, role) => sum + numberValue(usersByRole[role]), 0);

      ridesByStatus.active = Array.from(ACTIVE_RIDE_STATUSES)
        .reduce((sum, status) => sum + numberValue(ridesByStatus[status]), 0);
      ridesByStatus.all = RIDE_STATUSES
        .filter((status) => status !== 'all' && status !== 'active')
        .reduce((sum, status) => sum + numberValue(ridesByStatus[status]), 0);

      paymentsByStatus.all = PAYMENT_STATUSES
        .filter((status) => status !== 'all')
        .reduce((sum, status) => sum + numberValue(paymentsByStatus[status]), 0);

      const revenueRow = revenueRows[0] || {};
      const riderAvailabilityRow = riderAvailabilityRows[0] || {};

      const revenueByWindow = {
        all_time: numberValue(revenueRow.all_time_revenue),
        today: numberValue(revenueRow.today_revenue),
        last_7_days: numberValue(revenueRow.last_7_days_revenue)
      };

      const riderAvailabilityByState = {
        available: numberValue(riderAvailabilityRow.available_riders),
        unavailable: numberValue(riderAvailabilityRow.unavailable_riders)
      };
      riderAvailabilityByState.all = riderAvailabilityByState.available + riderAvailabilityByState.unavailable;

      setGaugeSeries(usersCount, USER_ROLES, usersByRole);
      setGaugeSeries(ridesCount, RIDE_STATUSES, ridesByStatus);
      setGaugeSeries(paymentsCount, PAYMENT_STATUSES, paymentsByStatus);
      setGaugeSeries(revenueAmount, REVENUE_WINDOWS, revenueByWindow);
      setGaugeSeries(riderAvailabilityCount, RIDER_AVAILABILITY_STATES, riderAvailabilityByState);

      businessMetricsUp.set(1);
      businessMetricsLastRefreshTimestampSeconds.set(Math.floor(Date.now() / 1000));
      businessMetricsCache.expiresAt = Date.now() + BUSINESS_METRICS_CACHE_MS;
    } catch (_error) {
      businessMetricsUp.set(0);
      businessMetricsCache.expiresAt = Date.now() + Math.min(BUSINESS_METRICS_CACHE_MS, 5000);
    } finally {
      businessMetricsCache.inFlight = null;
    }
  })();

  return businessMetricsCache.inFlight;
}

export function prometheusMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const timer = httpRequestDurationMs.startTimer();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: getRouteLabel(req),
      status_code: String(res.statusCode)
    };

    timer(labels);
    httpRequestsTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrorsTotal.inc(labels);
    }

    httpRequestsInFlight.dec();
  });

  next();
}

export async function metricsHandler(_req, res) {
  await refreshBusinessMetrics();
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

initializeBusinessMetrics();
