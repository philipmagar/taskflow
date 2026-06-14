# High Availability

**Goal**: Ensure service survives failures.

## Single Point of Failure Analysis

### Current
- One API
- One DB

**Problems**:
Server dies = Application down

## HA Concepts
Learn:
- Redundancy
- Primary
- Secondary
- Failover
- Primary dies → Secondary takes over
- Health Checks (`/health`)
