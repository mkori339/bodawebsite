import client from 'prom-client';

const register = new client.Registry();

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
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
