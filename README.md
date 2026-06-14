# TaskFlow DevSecOps API

A robust, secure, and scalable Task Management API built with Node.js, Express, and MySQL, encompassing a complete DevSecOps pipeline.

## Features
- **Secure Authentication**: JWT-based stateless authentication with password hashing.
- **Advanced Task Management**: Complete CRUD functionality with ownership protection.
- **Enterprise Security**: Helmet, Rate Limiting, CORS, and Input Validation.
- **Load Testing**: Advanced performance profiling using k6.
- **Structured Logging**: Domain-isolated Winston child loggers.
- **Containerization**: Hardened multi-stage Docker builds.

## Architecture

### Final Architecture
```text
Client
 ↓
NGINX
 ↓
Node API
 ↓
MySQL
```

### Monitoring
```text
├── Prometheus
├── Grafana
└── Alertmanager
```

### DevOps
```text
├── Docker
├── GitHub Actions
└── Security Scanning
```

### Operations
```text
├── Logging
├── Backups
└── Incident Response
```

## Installation
1. Clone the repository: `git clone https://github.com/philipmagar/taskflow.git`
2. Install dependencies: `npm install`
3. Setup environment: `cp .env.example .env` (Configure appropriately)
4. Run via Docker: `npm run docker:up`

## Security
- **Headers & Protection**: Helmet, Express Rate Limit, CORS.
- **Validation**: Strict input validation using `express-validator`.
- **Status**: See [`docs/security-audit.md`](docs/security-audit.md) for the final audit status.

## Monitoring
- **Prometheus**: Metric collection.
- **Grafana**: Real-time dashboards.
- **Alertmanager**: System notifications.

## CI/CD
- GitHub Actions for continuous integration.
- Automated testing and security scanning on every push.
- Zero-downtime continuous deployment.

## Testing
- Complete unit and integration test suite using Jest and Supertest.
- 100% test coverage threshold.
- Comprehensive K6 load testing.

## Deployment
- Deployment instructions covered in [`docs/deployment.md`](docs/deployment.md).
- Highly available design considerations in [`docs/high-availability.md`](docs/high-availability.md).

## Threat Model
Formal STRIDE-based threat model covering asset inventory, threat actor profiling, and attack surface mapping. See [`THREAT_MODEL.md`](THREAT_MODEL.md).

## Screenshots
*(Add relevant screenshots of Grafana dashboards and API usage here)*

## Future Improvements
- Implement Horizontal Scaling (1 → 3 → 10)
- Advanced Load Balancing techniques (NGINX/HAProxy)
- See [`docs/scaling-strategy.md`](docs/scaling-strategy.md) for scaling plans.
