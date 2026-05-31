# CS 421 Assignment 2 Report

## Title

Real-Time Communication Integration for a Bodaboda Application

## Objective

The objective of this assignment was to integrate real-time communication into the Bodaboda application using MQTT. The system should allow ride request information to be sent immediately from the backend to a subscribed client, such as a rider/driver simulation client.

## Tools Used

- Node.js and Express backend
- React frontend
- MySQL database
- Docker and Docker Compose
- Eclipse Mosquitto MQTT broker
- GitHub Actions CI/CD
- GitHub Container Registry

## Feature Implemented

The implemented feature is **Ride Request Broadcasting**.

When a customer creates a ride and completes demo payment, the backend updates the ride status to `waiting_rider`. After that, the backend publishes a real-time MQTT message to the topic `ride/request`. A rider subscriber can listen to that topic and receive the ride request immediately.

## How MQTT Works in This Project

The MQTT broker runs as a Docker service called `mqtt`. The backend connects to the broker using `mqtt://mqtt:1883` inside Docker. When a ride is paid, the backend publishes a JSON message to the topic `ride/request`.

Flow:

```text
Customer pays for ride
Backend updates ride status to waiting_rider
Backend publishes MQTT message to ride/request
Mosquitto broker receives the message
Subscriber client receives the ride request instantly
```

Important topics:

```text
ride/request
ride/status
```

Sample message:

```json
{
  "event": "ride_requested",
  "ride_id": 101,
  "customer_name": "Demo Passenger",
  "pickup_location": "Mlimani City",
  "destination_location": "Posta",
  "estimated_cost": 12000
}
```

## Important Note About Dashboards

The React customer and rider dashboards are connected to a backend Server-Sent Events stream at `/api/events/rides`. The backend subscribes to MQTT topic `ride/request` and forwards ride events to connected browser dashboards.

This means when a customer pays for a ride, the backend publishes an MQTT message, receives it through the MQTT bridge, and notifies browser dashboards. The rider dashboard can reload available requests automatically without a manual browser refresh.

When a rider accepts, starts, or completes a ride, the backend publishes a `ride/status` event. This allows the customer dashboard and rider dashboard to refresh their ride data without a manual browser refresh.

The terminal subscriber is still useful as extra proof that MQTT messages are being published and received.

## Files Added or Changed

- `docker-compose.yml`: added Mosquitto MQTT service.
- `deploy/docker-compose.deploy.yml`: added MQTT service for deployment.
- `mosquitto/config/mosquitto.conf`: MQTT broker configuration.
- `backend/src/messaging/mqttClient.js`: backend MQTT connection and JSON publish helper.
- `backend/src/messaging/rideRequestPublisher.js`: builds and publishes ride request events.
- `backend/src/controllers/rideController.js`: publishes MQTT event after ride payment.
- `backend/src/messaging/rideEventStream.js`: bridges MQTT ride events to browser dashboards using Server-Sent Events.
- `backend/scripts/rideRequestSubscriber.js`: subscriber client simulation.
- `backend/scripts/rideRequestPublisher.js`: demo publisher.
- `backend/tests/rideRequestPublisher.test.js`: test for MQTT topic and message format.
- `.github/workflows/ci.yml`: CI validates tests and Docker Compose config.
- `.github/workflows/cd.yml`: CD deploys MQTT config and verifies MQTT in staging/production.

## Screenshot Checklist

### Screenshot 1: Docker Containers Running

Command:

```bash
docker compose ps
```

What the screenshot must show:

- `backend`
- `frontend`
- `db`
- `mqtt`

Explanation:

The screenshot shows that all application services are running in Docker, including the MQTT broker service.

### Screenshot 2: MQTT Broker Logs

Command:

```bash
docker compose logs mqtt
```

What the screenshot must show:

- Mosquitto started successfully.
- MQTT broker listening on port `1883`.

Explanation:

The screenshot proves that the MQTT broker is running and ready to receive/publish messages.

### Screenshot 3: MQTT Subscriber Waiting for Ride Requests

Command:

```bash
npm --workspace backend run mqtt:subscribe
```

What the screenshot must show:

- Subscriber connected.
- Subscriber listening to `ride/request`.

Explanation:

The subscriber represents a rider/driver client waiting for new ride request messages.

### Screenshot 4: MQTT Demo Publisher Sending a Ride Request

Command:

```bash
npm --workspace backend run mqtt:publish-demo
```

What the screenshot must show:

- Demo ride request published successfully.

Explanation:

The publisher simulates the backend sending a ride request event to the MQTT broker.

### Screenshot 5: Subscriber Receiving the Message

Expected output:

```text
Received ride/request: {"event":"ride_requested", ...}
```

Explanation:

This screenshot is the most important MQTT evidence. It proves that a ride request was sent in real time and received by the subscribed client.

### Screenshot 6: Customer Dashboard

What the screenshot must show:

- Customer can create a ride request.
- Customer can pay for a ride.
- Ride becomes paid or waiting for rider.

Explanation:

This shows the application flow that triggers the backend MQTT publish event.

### Screenshot 7: Rider Dashboard

What the screenshot must show:

- Rider can view available paid ride requests.
- Rider can accept a ride.

Explanation:

This shows how the ride request is handled by a rider after it becomes available.

### Screenshot 8: CI Workflow Success

Where:

GitHub repository -> Actions -> CI

What the screenshot must show:

- CI workflow passed.
- Tests passed.
- Docker build or Compose validation passed.

Explanation:

This proves that automated testing and integration checks are working.

### Screenshot 9: CD Workflow Success

Where:

GitHub repository -> Actions -> CD

What the screenshot must show:

- Build and push passed.
- Deploy staging passed.
- Production approval step.
- Deploy production passed.

Explanation:

This proves that deployment automation is working after successful CI.

### Screenshot 10: Application Running After Deployment

URL examples:

```text
http://localhost:8081
http://localhost:8080
```

Explanation:

This proves that the deployed staging/production application is accessible.

## Procedure Followed

1. Added Mosquitto MQTT broker to Docker Compose.
2. Added backend MQTT client code.
3. Added ride request publisher logic.
4. Connected the payment flow to MQTT publishing.
5. Added a subscriber script to simulate a rider client.
6. Added a demo publisher script for testing real-time messages.
7. Added a test case for MQTT topic and message format.
8. Updated CI/CD workflow to test, build, deploy, and verify the MQTT service.
9. Ran the Docker application locally.
10. Tested publishing and subscribing to `ride/request`.

## CI/CD Explanation

The CI pipeline runs automatically when code is pushed. It installs dependencies, runs tests, validates Docker Compose configuration, and ensures the project can be built correctly.

The CD pipeline runs after successful CI. It builds Docker images, pushes them to GitHub Container Registry, deploys the application to staging, waits for approval, and then deploys to production. MQTT is deployed together with the backend, frontend, and database.

## Challenges and Solutions

Challenge:

Browsers do not normally subscribe to raw MQTT over TCP.

Solution:

The backend was extended with a Server-Sent Events bridge. The backend subscribes to MQTT topic `ride/request`, then forwards real-time ride events to the React dashboards through `/api/events/rides`.

Challenge:

The local GitHub runner had permission errors when creating deployment folders.

Solution:

The workflow was updated to use runner-owned folders such as `$HOME/bodarequest-staging` and `$HOME/bodarequest-production`.

## Conclusion

The Bodaboda application now includes real-time communication using MQTT. Ride request events are published by the backend and received by a subscriber through the Mosquitto broker. The application is Dockerized, tested by CI, and deployed using a CD workflow.
