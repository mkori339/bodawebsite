# CI/CD Assignment Setup Steps

This project now includes:

- `backend/tests/quoteCalculator.test.js`
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `deploy/docker-compose.deploy.yml`
- `deploy/.env.staging.example`
- `deploy/.env.production.example`

## 1. Push the Project to GitHub

Run these commands locally after reviewing the changes:

```bash
git add .
git commit -m "Add CI/CD pipeline for bodarequest assignment"
git push origin main
```

## 2. Confirm the CI Workflow

After pushing:

1. Open your GitHub repository.
2. Go to **Actions**.
3. Open the `CI` workflow.
4. Confirm these steps pass:
   - dependency installation
   - backend test
   - backend Docker image build
   - frontend Docker image build

## 3. Capture the Failed Pipeline Screenshot

To create evidence of a failed pipeline:

1. Open `backend/tests/quoteCalculator.test.js`.
2. Change one expected value, for example change `total: 6152` to `total: 6153`.
3. Commit and push the broken test.
4. Wait for the `CI` workflow to fail.
5. Take the screenshot.
6. Restore the correct value.
7. Commit and push again.

## 4. Prepare Your Staging and Production Servers

On each server, make sure these are installed:

- Docker
- Docker Compose plugin
- `curl`

Also make sure these ports are open if you use the example env files:

- staging: `8081`, `3002`, `3307`
- production: `8080`, `3001`, `3306`

## 5. Create GitHub Repository Secrets

Add these repository secrets in GitHub under:
`Settings` -> `Secrets and variables` -> `Actions`

Common secrets:

- `GHCR_USERNAME`
- `GHCR_PAT`

Staging secrets:

- `STAGING_HOST`
- `STAGING_USERNAME`
- `STAGING_SSH_KEY`
- `STAGING_APP_DIR`
- `STAGING_ENV_FILE`

Production secrets:

- `PRODUCTION_HOST`
- `PRODUCTION_USERNAME`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_APP_DIR`
- `PRODUCTION_ENV_FILE`

## 6. Secret Values Format

`GHCR_PAT`:

- use a GitHub Personal Access Token that can read packages
- if your GHCR packages are private, this is required for the server to pull images

`STAGING_APP_DIR` example:

```text
/opt/bodarequest-staging
```

`PRODUCTION_APP_DIR` example:

```text
/opt/bodarequest-production
```

`STAGING_ENV_FILE`:

Use the content from `deploy/.env.staging.example`, then replace the placeholders with real values.

`PRODUCTION_ENV_FILE`:

Use the content from `deploy/.env.production.example`, then replace the placeholders with real values.

## 7. Create GitHub Environments

Open:
`Settings` -> `Environments`

Create:

- `staging`
- `production`

For `production`:

1. Add a required reviewer.
2. This creates the manual approval gate required by the assignment.

## 8. How the CD Flow Works

After `CI` succeeds on `main`:

1. `CD` builds and pushes Docker images to `ghcr.io`
2. `CD` deploys automatically to `staging`
3. GitHub waits for manual approval at `production`
4. After approval, `CD` deploys to `production`

## 9. First Deployment Check

After staging deploys, verify:

```bash
curl http://YOUR_STAGING_SERVER_IP:8081
curl http://YOUR_STAGING_SERVER_IP:3002/api/health
```

After production deploys, verify:

```bash
curl http://YOUR_PRODUCTION_SERVER_IP:8080
curl http://YOUR_PRODUCTION_SERVER_IP:3001/api/health
```

## 10. Screenshot Checklist

Take these screenshots for submission:

- GitHub repository home page
- application running in Docker
- successful CI pipeline
- failed CI pipeline
- staging deployment success
- production approval gate
- production system running
- Docker image tags in GHCR
- logs from `docker compose logs`
- Grafana or monitoring output

## 11. Monitoring Evidence

For the monitoring requirement, you can use the existing local stack:

```bash
docker compose up --build -d
docker compose logs -f backend
docker compose logs -f frontend
```

Grafana is available at:

```text
http://localhost:3000
```
