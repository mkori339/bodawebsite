import mqtt from 'mqtt';

const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const topic = process.env.MQTT_TOPIC || 'ride/request';

const payload = {
  event: 'ride_requested',
  ride_id: Number(process.env.RIDE_ID || 101),
  customer_id: Number(process.env.CUSTOMER_ID || 7),
  customer_name: process.env.CUSTOMER_NAME || 'Demo Passenger',
  customer_phone: process.env.CUSTOMER_PHONE || '+255700000000',
  pickup_location: process.env.PICKUP_LOCATION || 'Nyerere Square',
  destination_location: process.env.DESTINATION_LOCATION || 'UDOM CIVE',
  estimated_cost: Number(process.env.ESTIMATED_COST || 6420),
  priority: process.env.PRIORITY || 'standard',
  passenger_count: Number(process.env.PASSENGER_COUNT || 1),
  helmet_required: process.env.HELMET_REQUIRED === 'true',
  requested_pickup_time: null,
  created_at: new Date().toISOString()
};

const client = mqtt.connect(mqttUrl, {
  clientId: `bodarequest-passenger-publisher-${process.pid}`,
  clean: true,
  connectTimeout: 3000
});

client.on('connect', () => {
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
    if (error) {
      console.error(`Failed to publish to ${topic}:`, error.message);
      process.exitCode = 1;
    } else {
      console.log(`Published ${topic}: ${JSON.stringify(payload)}`);
    }

    client.end();
  });
});

client.on('error', (error) => {
  console.error(`MQTT error: ${error.message}`);
  process.exitCode = 1;
  client.end();
});
