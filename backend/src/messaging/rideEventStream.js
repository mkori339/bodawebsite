import jwt from 'jsonwebtoken';
import { RIDE_REQUEST_TOPIC, RIDE_STATUS_TOPIC } from './rideRequestPublisher.js';
import { subscribeJson } from './mqttClient.js';
import { logInfo, logWarn } from '../utils/logger.js';

const clients = new Set();
let bridgeStarted = false;

function sendEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function rideEventsHandler(req, res) {
  const token = req.query.token;

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'change-me');
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  res.flushHeaders?.();

  sendEvent(res, 'connected', {
    event: 'connected',
    timestamp: new Date().toISOString()
  });

  clients.add(res);
  req.on('close', () => {
    clients.delete(res);
  });
}

export function broadcastRideEvent(event, payload) {
  for (const client of clients) {
    sendEvent(client, event, payload);
  }
}

export function startRideEventBridge() {
  if (bridgeStarted) {
    return;
  }

  bridgeStarted = true;

  const subscribe = async () => {
    try {
      await subscribeJson(RIDE_REQUEST_TOPIC, (payload) => {
        broadcastRideEvent('ride_request', payload);
      });
      await subscribeJson(RIDE_STATUS_TOPIC, (payload) => {
        broadcastRideEvent('ride_status', payload);
      });
      logInfo('ride_event_stream_bridge_started', { topics: [RIDE_REQUEST_TOPIC, RIDE_STATUS_TOPIC] });
    } catch (error) {
      logWarn('ride_event_stream_bridge_failed', { error_message: error.message });
      setTimeout(subscribe, 5000);
    }
  };

  subscribe();
}
