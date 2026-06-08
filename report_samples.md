# Report Sample 1: MQTT Real-Time Integration

## 1. Introduction
The BodaRequest platform uses MQTT (Message Queuing Telemetry Transport) to enable real-time communication between customers and riders. This protocol allows for instant ride request broadcasting without the overhead of traditional HTTP polling.

## 2. How MQTT Works
MQTT is a lightweight publish/subscribe messaging protocol. In this project:
- **Broker:** Eclipse Mosquitto acts as the central hub.
- **Publishers:** The Backend API publishes ride details when a payment is confirmed.
- **Subscribers:** Rider clients or dashboards listen for new requests.

### Real-Time Flow
1. **Passenger Action:** Customer completes a ride payment.
2. **Backend Update:** Backend updates ride status to `waiting_rider`.
3. **Event Publication:** Backend publishes a JSON payload to the `ride/request` topic.
4. **Broker Delivery:** Mosquitto delivers the message to all active subscribers.
5. **Rider Action:** The rider dashboard receives the notification instantly and displays the new ride.

<!-- [IMAGE COMMENT: Insert a diagram showing the Publish/Subscribe flow between Backend, Mosquitto, and Rider Client] -->

## 3. Implementation Details
### Backend Integration
The backend uses the `mqtt` library to connect to the broker.
- **Topic:** `ride/request`
- **Broker URL:** `mqtt://mqtt:1883` (Internal Docker network)

### Payload Structure
```json
{
  "event": "ride_requested",
  "ride_id": 105,
  "customer_name": "John Doe",
  "pickup_location": "Nyerere Square",
  "destination_location": "UDOM CIVE",
  "estimated_cost": 5000
}
```

<!-- [IMAGE COMMENT: Insert a screenshot of the backend code in `rideController.js` or `mqttClient.js` showing the publish logic] -->

## 4. Verification and Testing
To verify the implementation, we use a dedicated subscriber script.
- **Command:** `npm --workspace backend run mqtt:subscribe`

<!-- [IMAGE COMMENT: Insert a screenshot of the terminal showing the subscriber receiving a real-time message] -->

---

# Report Sample 2: Assignment 3 - CI/CD, Monitoring, and Deployment

## 1. Project Objective
Assignment 3 focuses on automating the software development lifecycle (SDLC) through CI/CD pipelines and establishing a robust monitoring stack for the BodaRequest system.

## 2. CI/CD Pipeline Workflow
We use **GitHub Actions** to automate testing and deployment.

### Continuous Integration (CI)
- **Trigger:** Every push to the `main` branch.
- **Tasks:**
  - Dependency installation.
  - Backend unit testing (using Jest).
  - Docker Compose configuration validation.
  - Docker image builds for frontend and backend.

<!-- [IMAGE COMMENT: Insert a screenshot of a successful GitHub Actions CI workflow run] -->

### Continuous Deployment (CD)
- **Registry:** Docker images are pushed to **GitHub Container Registry (GHCR)** or **Docker Hub**.
- **Environments:** 
  - **Staging:** Automatic deployment for testing.
  - **Production:** Requires manual approval gate.
- **Verification:** The pipeline runs a post-deployment check to ensure the MQTT broker is reachable.

<!-- [IMAGE COMMENT: Insert a screenshot of the CD pipeline showing the "Production Approval" wait state] -->

## 3. Monitoring and Observability
The project implements the **LGTM stack** (Loki, Grafana, Tempo/Tail, Prometheus) for full visibility.

- **Prometheus:** Collects system metrics (CPU, Memory) and application metrics (API hits, active users).
- **Loki & Promtail:** Aggregates logs from all containers into a searchable interface.
- **Grafana:** Provides pre-built dashboards for business and system health.

### Key Metrics Tracked
- API response times.
- Successful vs. Failed payments.
- Real-time ride request volume.

<!-- [IMAGE COMMENT: Insert a screenshot of the Grafana "Bodarequest Overview" dashboard] -->

## 4. Scalability and Reliability
By using Docker Hub as a third-party registry and containerizing the entire stack, the BodaRequest system can:
1. **Scale Horizontally:** Easily spin up more backend instances during peak hours.
2. **Self-Heal:** Docker automatically restarts crashed containers.
3. **Rollback:** Instantly revert to a previous image tag if a bug is detected in production.

<!-- [IMAGE COMMENT: Insert a screenshot showing multiple Docker containers running or GHCR image tags] -->

## 5. Conclusion
The implementation of automated pipelines and centralized monitoring ensures that the BodaRequest platform is production-ready, reliable, and easily maintainable.
