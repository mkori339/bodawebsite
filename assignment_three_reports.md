# Assignment Three: Third-Party Deployment Integration (Group Report)

## 1. Chosen Platform
For this assignment, we integrated **Docker Hub** (or **GitHub Container Registry - GHCR**) as our third-party registry and **DigitalOcean/Local Production Server** as our deployment target. 
- **Registry:** Docker Hub/GHCR (Used for storing and versioning Docker images).
- **Deployment Target:** A Linux-based server configured to pull images directly from the registry.

## 2. Pipeline Workflow
Our CI/CD pipeline follows a rigorous sequence to ensure only tested code reaches production:

1.  **Code Push:** Triggered automatically when code is pushed to the `main` branch.
2.  **Build & Test:**
    - The environment is set up (Node.js, Docker).
    - Dependencies are installed.
    - Backend unit tests are executed. If tests fail, the pipeline stops immediately (Failure Handling).
3.  **Publish (Third-Party Integration):**
    - The pipeline logs in to the external registry (Docker Hub/GHCR) using secure secrets.
    - Docker images are built and tagged with `latest` and `v1.0` (as required).
    - Images are pushed to the remote registry.
4.  **Deployment:**
    - The production server receives a trigger or SSH command.
    - Instead of building locally, the server **pulls** the specific tagged images from the registry.
    - Containers are restarted using `docker-compose`.
5.  **MQTT Verification:**
    - After deployment, the pipeline runs a verification script to ensure the MQTT broker is active and can successfully broadcast ride requests.

<!-- [IMAGE COMMENT: Insert a screenshot of the GitHub Actions workflow showing the sequence: Build -> Test -> Publish -> Deploy] -->

## 3. Failure Handling and Quality Control
The pipeline is designed to "fail fast." If the `Backend Tests` stage fails, the `Publish` and `Deploy` stages are skipped. This prevents broken versions of the Bodaboda system from being pushed to the registry or deployed to users.

<!-- [IMAGE COMMENT: Insert a screenshot of a FAILED pipeline where the 'Publish' stage was skipped because tests failed] -->

## 4. Implementation Details
### Publish Stage (GitHub Actions Snippet)
```yaml
publish:
  needs: test
  steps:
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_HUB_USERNAME }}
        password: ${{ secrets.DOCKER_HUB_TOKEN }}
    - name: Build and Push
      run: |
        docker build -t user/bodaboda-backend:v1.0 .
        docker tag user/bodaboda-backend:v1.0 user/bodaboda-backend:latest
        docker push user/bodaboda-backend:v1.0
        docker push user/bodaboda-backend:latest
```

<!-- [IMAGE COMMENT: Insert a screenshot of your Docker Hub / GHCR repository showing the 'v1.0' and 'latest' tags successfully pushed] -->

## 5. MQTT Functionality Post-Deployment
Real-time communication remains the core of the system. After the cloud deployment, we verified MQTT by:
1. Connecting a subscriber to the production broker.
2. Triggering a ride payment in the deployed app.
3. Confirming the `ride/request` message was received instantly in the subscriber terminal.

<!-- [IMAGE COMMENT: Insert a screenshot of the production application running with a terminal showing MQTT messages being received from the server] -->

## 6. Challenges Encountered
- **Credential Management:** Securely passing SSH keys and Registry tokens without exposing them in the code. *Solution: Used GitHub Secrets.*
- **Pulling from Private Registry:** The server initially failed to pull images. *Solution: Configured `docker login` on the server as part of the deployment script.*
- **Asynchronous MQTT Tests:** The pipeline would finish before the MQTT message was received. *Solution: Implemented a wait-and-verify script with a timeout.*

---

# Individual Reflection: Third-Party Deployment (Draft for Handwriting)

**Student Name:** [Your Name]
**Topic:** Third-Party Deployment and Scalability in the Bodaboda System

### 1. Concept of Third-Party Deployment
Third-party deployment means using external professional services (like AWS, DigitalOcean, or Docker Hub) to handle parts of the application lifecycle. Instead of keeping everything on one local machine, we distribute the application's storage and hosting to specialized providers. This ensures the application is accessible globally and is not tied to a single developer's hardware.

### 2. Importance of Docker Registries in Industry
In the professional world, Docker Registries (like Docker Hub) act as a "Single Source of Truth." They allow teams to:
- **Version Control Images:** By using tags like `v1.0`, we can always go back to a stable version if a new update fails.
- **Consistency:** Every environment (Testing, Staging, Production) pulls the exact same image, eliminating "it works on my machine" errors.
- **Security:** Professional registries scan images for viruses or vulnerabilities before they are used.

### 3. Differences Between Local and Cloud Deployment
- **Local Deployment:** Is done on a private computer. It is good for development but risky because if the computer loses power or internet, the app goes down.
- **Cloud Deployment:** Is done on professional servers in data centers. It offers 99.9% uptime, better security, and can handle thousands of users simultaneously.

### 4. Improving Scalability and Reliability of the Bodaboda System
- **Scalability:** With third-party deployment, if the Bodaboda app becomes popular in a new city, we don't need to buy new computers. We can simply "spin up" more instances of our Docker images in the cloud to handle the extra traffic.
- **Reliability:** By automating the pipeline, we ensure that every version of the app is tested before it is published. If a server fails, the cloud provider can automatically restart our containers using the images stored in the registry, ensuring riders and customers can always use the service.
