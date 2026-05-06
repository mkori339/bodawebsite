# BodaRequest

BodaRequest is a full-stack ride-request platform prototype for boda boda transport. It includes:

- A React frontend with a landing page, authentication, customer booking flow, rider trip board, and admin dashboard
- A Node.js + Express backend with JWT authentication and MySQL persistence
- A MySQL schema plus a concept-and-flow document for the overall product

## Stack

- Frontend: React, Vite, React Router, Lucide icons
- Backend: Node.js, Express, MySQL (`mysql2`), JWT, bcrypt
- Database: MySQL

## Docker Setup

The project is now containerized with six services:

- `frontend`: React app built with Vite and served by Nginx
- `backend`: Express API on port `3001`
- `db`: MySQL 8.4 with automatic schema import from `backend/database/schema.sql`
- `loki`: log storage for Grafana
- `promtail`: log collector that reads application log files and ships them to Loki
- `grafana`: dashboard and log exploration UI with Loki preconfigured as the default data source

### First Run

Build and start everything:

```bash
docker compose up --build -d
```

Open the app:

- Frontend: http://localhost:8080
- API health check: http://localhost:3001/api/health
- MySQL: `localhost:3306`
- Grafana: http://localhost:3000

### Common Docker Commands

Start containers in the background:

```bash
docker compose up -d
```

Rebuild after code or Dockerfile changes:

```bash
docker compose up --build -d
```

See running containers:

```bash
docker compose ps
```

View logs for all services:

```bash
docker compose logs -f
```

View logs for one service:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f loki
docker compose logs -f promtail
docker compose logs -f grafana
```

Stop containers without removing them:

```bash
docker compose stop
```

Start previously stopped containers:

```bash
docker compose start
```

Restart one service:

```bash
docker compose restart backend
```

Stop and remove containers, network, and anonymous resources:

```bash
docker compose down
```

Remove containers and also delete the MySQL data volume:

```bash
docker compose down -v
```

Open a shell inside a container:

```bash
docker compose exec backend sh
docker compose exec db mysql -uroot -proot bodarequest
```

### How This Docker Setup Works

- The `db` service uses the official `mysql:8.4` image.
- On the first startup, MySQL imports `backend/database/schema.sql` automatically.
- The `backend` service connects to MySQL using the Compose service name `db` instead of `localhost`.
- The `frontend` service is built into static files and served by Nginx.
- Nginx forwards `/api/*` requests to the backend container, so the browser only needs one origin: `http://localhost:8080`.
- For local non-Docker development, Vite now proxies `/api` to `http://localhost:3001`, so the frontend uses the same API path in both modes.
- The `backend` writes structured JSON request and error logs to a shared Docker volume.
- Nginx writes structured JSON access logs to the same shared Docker volume.
- `promtail` tails those log files and pushes them to `loki`.
- `grafana` connects to `loki` automatically through provisioning, so no manual data source setup is required.

### Grafana Log Usage

After the containers are running, open Grafana at `http://localhost:3000` and sign in with:

- Username: `admin`
- Password: `admin123`

You can override those defaults with environment variables in a root `.env` file.

To see logs:

1. Open Grafana and go to **Explore**.
2. Select the default `Loki` data source.
3. Generate some traffic by opening the frontend or calling the API:

```bash
curl http://localhost:3001/api/health
```

4. Run queries such as:

```logql
{service="bodarequest-backend"}
{service="bodarequest-frontend"}
{service="bodarequest-backend"} |= "error"
{service="bodarequest-backend"} | json | status_code >= 400
```

Useful notes:

- Backend logs include request id, method, path, status code, response time, and error details.
- Frontend logs come from Nginx access logs, including request path, status code, and upstream timing.
- The first Grafana login may take a few seconds while the observability containers finish starting.

### Environment Variables Used in Docker

These are already given defaults in `docker-compose.yml`, but you can override them by creating a root-level `.env` file before running Docker:

```env
FRONTEND_PORT=8080
BACKEND_PORT=3001
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=bodarequest
FRONTEND_URL=http://localhost:8080
JWT_SECRET=change-me
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
LOKI_PORT=3100
```

Important notes:

- If you change `schema.sql` after the database volume already exists, MySQL will not re-import it automatically.
- `docker compose down -v` also resets Grafana, Loki, and the shared application log volume.
- Loki and Grafana are heavier than the base app services. If Docker is memory-constrained, allow a bit more RAM before starting the full stack.
- To recreate the database from scratch, run:

```bash
docker compose down -v
docker compose up --build -d
```

## Local Non-Docker Start

1. Install dependencies:

```bash
npm install
```

2. Create the database and tables:

```bash
mysql -u root -p < backend/database/schema.sql
```

3. Configure the backend environment:

```bash
cp backend/.env.example backend/.env
```

4. Configure the frontend environment if needed:

```bash
cp frontend/.env.example frontend/.env
```

5. Start both apps:

```bash
npm run dev
```

App URLs in local development:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

The frontend now uses `/api` by default, and Vite proxies that path to the backend during local development.

## Demo Roles

For this prototype, registration allows `customer`, `rider`, and `admin` roles from the UI so every workflow can be demonstrated quickly. In production, admin creation should be restricted.

## Core Flow

1. Customer registers or logs in
2. Customer fills pickup, destination, distance, and ride preferences
3. System calculates a fare estimate
4. Customer creates the trip, then completes a demo payment
5. Ride becomes visible to riders
6. Rider accepts, starts, and completes the trip
7. Admin tracks trips, payments, and rider performance

## Project Docs

- Product concept and flow: [docs/project-concept-and-flow.md](docs/project-concept-and-flow.md)
- Database schema: [backend/database/schema.sql](backend/database/schema.sql)
////////////////////////
How it is set:

  - db: MySQL 8.4, with backend/database/schema.sql auto-
  imported on first container startup.
  - backend: Node/Express app, connected to MySQL through
  the Compose service name db instead of localhost.
  - frontend: React app built to static files, served by
  Nginx on http://localhost:8080.
  - Nginx forwards /api/* to the backend, so the browser
  uses one URL and avoids CORS issues.

  How to use Docker:

  docker compose up --build -d
  docker compose ps
  docker compose logs -f
  docker compose stop
  docker compose start
  docker compose restart backend
  docker compose down
  docker compose down -v

  Useful URLs after start:

  - docker compose down stops and removes containers, but
  keeps MySQL data.
  - docker compose down -v also deletes the MySQL volume,
  so the database is recreated from schema.sql on next
  docker compose up --build -d.

  Verification status:

  - docker compose config passed.
  - Frontend production build passed.
  - Backend syntax checks passed.
  - Full docker compose up could not be completed here
  because this machine requires sudo password access to
  Docker. If you get permission denied on /var/run/
  docker.sock, run the same commands with sudo, or add
  your user to the docker group and log in again.
It is already connected for
  server-side logs. You do not
  need to manually connect
  Grafana to the current frontend
  and backend logging flow.

  What is already wired:

  - frontend Nginx access logs
    are written to a shared log
    volume.
  - backend Express logs are
    written as structured JSON.
  - promtail reads those log
    files.
  - loki stores them.
  - grafana is already
    provisioned with Loki as the
    default data source.

  So for the current setup,
  Grafana is ready to use for log
  analysis.

  What you can do with it now:

  - See all backend requests and
    errors.
  - See frontend/Nginx access
    logs.
  - Filter by service, path,
    method, status code.
  - Follow one request across
    frontend and backend using
    request_id.
  - Check slow requests by
    looking at duration_ms in
    backend logs.
  - Search for failures like 400,
    401, 500.

  How to use it:

  1. Start the stack with docker
     compose up --build -d
  2. Open http://localhost:3000
  3. Login with admin / admin123
  4. Open Explore
  5. Use the Loki data source
  6. Generate traffic by opening
     the app or calling:

  curl
  http://localhost:3001/api/health

  Useful queries:

  {service="bodarequest-backend"}
  {service="bodarequest-
  frontend"}
  {service="bodarequest-backend"}
  |= "error"
  {service="bodarequest-backend"}
  | json | status_code >= 400

  Important detail:

  - If you use the app through
    http://localhost:8080, you w
    ill see both frontend and ba
    ckend logs for API traffic.
  - If you call
    http://localhost:3001 direct
    ly, you will only see backend
    logs.

  What is not connected yet:

  - MySQL metrics/logs are not in
    Grafana yet.
  - Docker/container CPU/RAM
    metrics are not in Grafana
    yet.
  - Browser-side React errors are
    not in Grafana yet.
  - There are no dashboards or
    alerts prebuilt yet, only the
    log pipeline.

  So the current setup is:

  - Ready for application log
    monitoring
  - Not yet ready for metrics/
    traces/database monitoring

  If you want deeper monitoring,
  the next common additions are:

  - Prometheus for metrics
  - node-exporter for machine
    stats
  - cAdvisor for container stats
  - mysqld-exporter for MySQL
    metrics

  If you want, I can do the next
  step and add:

  1. Grafana dashboards
  2. MySQL metrics
  3. Docker/container metrics
  4. Alerts for 500 errors and
     slow requests