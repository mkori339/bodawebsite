import { randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const service = process.env.LOG_SERVICE_NAME || 'bodarequest-backend';
const environment = process.env.NODE_ENV || 'development';
const logFilePath = process.env.LOG_FILE_PATH;
const ignoredRequestPaths = new Set(['/metrics']);

let fileStream;

if (logFilePath) {
  mkdirSync(dirname(logFilePath), { recursive: true });
  fileStream = createWriteStream(logFilePath, { flags: 'a' });
}

function normalizeFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  );
}

function writeLog(level, message, fields = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    service,
    environment,
    level,
    message,
    ...normalizeFields(fields)
  };

  const line = JSON.stringify(payload);
  const writer =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  writer(line);

  if (fileStream) {
    fileStream.write(`${line}\n`);
  }
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress;
}

export function logInfo(message, fields) {
  writeLog('info', message, fields);
}

export function logWarn(message, fields) {
  writeLog('warn', message, fields);
}

export function logError(error, fields = {}) {
  writeLog('error', error?.message || 'Unhandled error', {
    error_name: error?.name,
    stack: error?.stack,
    ...fields
  });
}

export function requestLogger(req, res, next) {
  if (ignoredRequestPaths.has(req.path)) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();
  const requestId = req.get('x-request-id') || randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logInfo('http_request', {
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
      client_ip: getClientIp(req),
      user_agent: req.get('user-agent') || undefined
    });
  });

  next();
}
