import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRideRequestMessage,
  buildRideStatusMessage,
  RIDE_REQUEST_TOPIC,
  RIDE_STATUS_TOPIC
} from '../src/messaging/rideRequestPublisher.js';

test('ride request MQTT topic is defined', () => {
  assert.equal(RIDE_REQUEST_TOPIC, 'ride/request');
});

test('ride status MQTT topic is defined', () => {
  assert.equal(RIDE_STATUS_TOPIC, 'ride/status');
});

test('buildRideRequestMessage returns the expected JSON payload', () => {
  const message = buildRideRequestMessage({
    id: 12,
    customer_id: 3,
    customer_name: 'Asha Juma',
    customer_phone: '+255700123456',
    pickup_location: 'Nyerere Square',
    destination_location: 'UDOM CIVE',
    estimated_cost: '6420.00',
    priority: 'standard',
    passenger_count: 1,
    helmet_required: 1,
    requested_pickup_time: null
  });

  assert.equal(message.event, 'ride_requested');
  assert.equal(message.ride_id, 12);
  assert.equal(message.customer_id, 3);
  assert.equal(message.pickup_location, 'Nyerere Square');
  assert.equal(message.destination_location, 'UDOM CIVE');
  assert.equal(message.estimated_cost, 6420);
  assert.equal(message.helmet_required, true);
  assert.match(message.created_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('buildRideStatusMessage returns the expected ride lifecycle payload', () => {
  const message = buildRideStatusMessage({
    id: 12,
    customer_id: 3,
    rider_id: 8,
    customer_name: 'Asha Juma',
    rider_name: 'Juma Rider',
    ride_status: 'rider_assigned',
    payment_status: 'paid',
    pickup_location: 'Nyerere Square',
    destination_location: 'UDOM CIVE'
  }, 'ride_accepted');

  assert.equal(message.event, 'ride_accepted');
  assert.equal(message.ride_id, 12);
  assert.equal(message.rider_id, 8);
  assert.equal(message.ride_status, 'rider_assigned');
  assert.equal(message.payment_status, 'paid');
  assert.match(message.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});
