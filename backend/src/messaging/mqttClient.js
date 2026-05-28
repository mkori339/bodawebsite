import mqtt from 'mqtt';
import { logInfo, logWarn } from '../utils/logger.js';

const defaultMqttUrl = process.env.NODE_ENV === 'production' ? 'mqtt://mqtt:1883' : 'mqtt://localhost:1883';
const mqttUrl = process.env.MQTT_URL || defaultMqttUrl;
const mqttClientId = process.env.MQTT_CLIENT_ID || `bodarequest-backend-${process.pid}`;

let client;
let connectionPromise;

function connectMqttClient() {
  if (client?.connected) {
    return Promise.resolve(client);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  client = mqtt.connect(mqttUrl, {
    clientId: mqttClientId,
    clean: true,
    connectTimeout: 3000,
    reconnectPeriod: 2000
  });

  client.on('connect', () => {
    logInfo('mqtt_connected', { mqtt_url: mqttUrl, client_id: mqttClientId });
  });

  client.on('reconnect', () => {
    logInfo('mqtt_reconnecting', { mqtt_url: mqttUrl });
  });

  client.on('error', (error) => {
    logWarn('mqtt_error', { error_message: error.message, mqtt_url: mqttUrl });
  });

  connectionPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out connecting to MQTT broker at ${mqttUrl}`));
    }, 3500);

    client.once('connect', () => {
      clearTimeout(timer);
      resolve(client);
    });

    client.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  })
    .catch((error) => {
      client?.end(true);
      client = undefined;
      throw error;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

export async function publishJson(topic, payload, options = {}) {
  const mqttClient = await connectMqttClient();
  const message = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    mqttClient.publish(topic, message, { qos: 1, ...options }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      logInfo('mqtt_message_published', { topic, event: payload.event });
      resolve();
    });
  });
}
