# Scaling Strategy

## Horizontal Scaling
Add more servers:
1 → 3 → 10

## Vertical Scaling
Increase:
- CPU
- RAM
- Storage

## Load Balancing
Implemented Load Balancers (available in Docker Compose):
- **NGINX** (Port 80): Uses standard `upstream` block for round-robin load balancing.
- **HAProxy** (Port 8080): Uses `server-template` and Docker's internal DNS (`127.0.0.11`) for dynamic horizontal scaling.
