import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { metricsHandler, prometheusMiddleware } from './monitoring/metrics.js';
import { rideEventsHandler, startRideEventBridge } from './messaging/rideEventStream.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import { logError, requestLogger } from './utils/logger.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
);
app.get('/metrics', metricsHandler);
app.use(prometheusMiddleware);
app.use(requestLogger);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bodarequest-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/events/rides', rideEventsHandler);
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);

startRideEventBridge();

app.use((error, req, res, _next) => {
  logError(error, {
    request_id: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status_code: error.status || 500
  });

  res.status(error.status || 500).json({
    message: error.message || 'Internal server error.'
  });
});

export default app;
