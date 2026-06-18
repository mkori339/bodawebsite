import mqtt from 'mqtt';

const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const topic = process.env.MQTT_TOPIC || 'ride/#';
const clientId = process.env.MQTT_CLIENT_ID || `bodarequest-driver-subscriber-${process.pid}`;

const client = mqtt.connect(mqttUrl, {
  clientId,
  clean: true,
  connectTimeout: 3000,
  reconnectPeriod: 2000
});

client.on('connect', () => {
  console.log(`Connected to ${mqttUrl}`);
  client.subscribe(topic, { qos: 1 }, (error) => {
    if (error) {
      console.error(`Failed to subscribe to ${topic}:`, error.message);
      process.exitCode = 1;
      client.end();
      return;
    }

    console.log(`Listening for all ride events on ${topic}`);
  });
});

client.on('message', (messageTopic, message) => {
  console.log(`Received ${messageTopic}: ${message.toString()}`);
});

client.on('error', (error) => {
  console.error(`MQTT error: ${error.message}`);
});
