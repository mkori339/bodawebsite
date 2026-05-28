import { publishJson } from './mqttClient.js';
import { logWarn } from '../utils/logger.js';

export const RIDE_REQUEST_TOPIC = 'ride/request';

export function buildRideRequestMessage(ride) {
  return {
    event: 'ride_requested',
    ride_id: ride.id,
    customer_id: ride.customer_id,
    customer_name: ride.customer_name,
    customer_phone: ride.customer_phone,
    pickup_location: ride.pickup_location,
    destination_location: ride.destination_location,
    estimated_cost: Number(ride.estimated_cost),
    priority: ride.priority,
    passenger_count: ride.passenger_count,
    helmet_required: Boolean(ride.helmet_required),
    requested_pickup_time: ride.requested_pickup_time,
    created_at: new Date().toISOString()
  };
}

export async function publishRideRequest(payload) {
  try {
    await publishJson(RIDE_REQUEST_TOPIC, payload);
    return true;
  } catch (error) {
    logWarn('mqtt_ride_request_publish_failed', {
      topic: RIDE_REQUEST_TOPIC,
      ride_id: payload.ride_id,
      error_message: error.message
    });
    return false;
  }
}
