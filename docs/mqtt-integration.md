# MQTT Integration

## Feature Implemented

The project implements **Ride Request Broadcasting**.

When a passenger completes the demo payment for a ride, the backend changes the ride status to `waiting_rider` and publishes a real-time MQTT message. A driver subscriber can receive that ride request instantly.

## Broker

The MQTT broker is Eclipse Mosquitto.

Docker service:

```text
mqtt
```

Local broker URL:

```text
mqtt://localhost:1883
```

Backend Docker broker URL:

```text
mqtt://mqtt:1883
```

## Topic

```text
ride/request
```

## Message Format

```json
{
  "event": "ride_requested",
  "ride_id": 12,
  "customer_id": 3,
  "customer_name": "Asha Juma",
  "customer_phone": "+255700123456",
  "pickup_location": "Nyerere Square",
  "destination_location": "UDOM CIVE",
  "estimated_cost": 6420,
  "priority": "standard",
  "passenger_count": 1,
  "helmet_required": true,
  "requested_pickup_time": null,
  "created_at": "2026-05-27T12:00:00.000Z"
}
```

## How It Works

1. Passenger creates a ride request.
2. Passenger completes demo payment.
3. `payForRide()` updates the ride to `waiting_rider`.
4. The backend publishes the ride request to `ride/request`.
5. A driver subscriber receives the message immediately.

Relevant backend files:

```text
backend/src/controllers/rideController.js
backend/src/messaging/mqttClient.js
backend/src/messaging/rideRequestPublisher.js
```

## Demo Procedure

Start the full Docker stack:

```bash
docker compose up --build -d
```

Confirm the MQTT broker is running:

```bash
docker compose ps mqtt
```

Open a subscriber terminal:

```bash
npm --workspace backend run mqtt:subscribe
```

In another terminal, publish a demo ride request:

```bash
npm --workspace backend run mqtt:publish-demo
```

Expected subscriber output:

```text
Received ride/request: {"event":"ride_requested", ...}
```

For the real application flow, keep the subscriber open, then create and pay for a ride from the customer dashboard. The backend will publish the same `ride/request` event after payment.

## CI/CD Integration

The Docker setup now includes the MQTT broker. The deployment compose file also includes the broker, so staging and production deploy MQTT together with the app.

The CD workflow verifies MQTT during deployment by running:

```bash
docker compose -f deploy/docker-compose.deploy.yml exec -T mqtt mosquitto_pub -h localhost -p 1883 -t deploy/check -m "staging-mqtt-ok"
```

The backend test suite also verifies the MQTT topic and ride request message format.
