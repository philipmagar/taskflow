# Architecture Overview

This document describes the architecture for the TaskFlow Node.js Express API, including its key components and how they interact. The architecture features a layered design focused on security, observability, and testability.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js 5.2.1
- **Database:** MySQL 3.18.0
- **Authentication:** JWT (jsonwebtoken 9.0.3)
- **Password Security:** bcryptjs 3.0.3
- **Input Validation:** joi 18.0.2, express-validator 7.3.1
- **HTTP Logging:** Morgan 1.10.1
- **Application Logging:** Winston 3.19.0
- **Testing:** Jest 30.3.0, Supertest 7.2.2
- **Security Middleware:** Helmet (Headers), HPP (Parameter Pollution), Express-Rate-Limit
- **Environment:** dotenv 17.3.1

## Architecture Layers

### 1. Client Layer
- Frontend applications or external API consumers.
- Sends HTTP requests to the API endpoints.

### 2. Security Middleware Layer
- **Helmet:** Sets secure HTTP headers (XSS, Clickjacking protection).
- **HPP:** Protects against HTTP Parameter Pollution.
- **Rate Limiting:** Prevents DDoS and brute-force attacks.
- **Security Detector:** Custom utility that scans for SQL Injection and XSS patterns in real-time.
- **IP Blocking:** Automatically blocks suspicious IPs for 15 minutes after threshold violations.

### 3. API Gateway / Express Server
- Entry point for all client requests.
- Implements **Request ID Middleware** to assign unique UUIDs to every request for traceablity.
- Implements **Request Logger** (Winston-based) for structured traffic monitoring.

### 4. Authentication Layer
- **JWT Authentication:** Stateful token validation via `protect` middleware.
- **RBAC:** Role-based authorization via `restrictTo` middleware.

### 5. Validation Layer
- **express-validator:** Schema-based field validation and sanitization.
- Ensures data integrity before reaching the business logic.

### 6. Service Layer (Business Logic)
- **TaskService / OrderService:** Contains all core business logic and transaction management.
- Decoupled from controllers to ensure reusability and testability.
- Handles atomic database operations (Rollback/Commit).

### 7. Data Access Layer (Models)
- **MySQL Database:** Persistent storage.
- **Database Indexing:** Optimized for performance (User ID, Status, CreatedAt indexes).
- **Caching Layer:** In-memory TTL-based caching for frequent read operations.

### 8. Testing & QA Layer
- **Automated Tests:** Comprehensive unit and integration tests using **Jest**.
- **Mocking System:** Isolated tests using database mocks to ensure reliability without infrastructure dependencies.
- **Security Audit:** Automated verification of security filters and middleware.

## System Flow Diagram

```mermaid
graph TD
    A[Client/Consumer] -->|HTTP Request| Sec[Security Layer<br/>Helmet/HPP/RateLimit]
    Sec -->|Suspicious| Block[Block IP / 400 Bad Request]
    Sec -->|Clean| B[Express Server<br/>Request ID assigned]
    B -->|Route Request| C{Authentication<br/>JWT Token}
    C -->|Invalid| D[Return 401/403]
    C -->|Valid| E[Input Validation<br/>express-validator]
    E -->|Invalid| F[Return 400<br/>Validation Error]
    E -->|Valid| G[Service Layer<br/>Business Logic]
    G -->|Query/Mutate| H[(MySQL Database)]
    G <-->|TTL Cache| Cache[In-memory Cache]
    H -->|Data| G
    G -->|Response| I[Express Server]
    I -->|HTTP Response<br/>X-Request-ID Header| A
    B-.-|Structured Logs| L[Winston Logger]
    L -->|Rotation| M[(Log Files<br/>error.log, combined.log)]
```

## Key Components

| Component | Purpose | Technology |
|-----------|---------|-----------|
| Security Hardening | Headers & Attack Prevention | Helmet, HPP, SecurityDetector |
| Authentication | Secure API access with JWT | jsonwebtoken |
| Service Layer | Decoupled Business Logic | Service Objects (task.service.js) |
| Performance | Optimized queries & caching | MySQL Indexes, In-memory Cache |
| Reliability | Comprehensive Testing | Jest, Supertest, Mocking |
| Traceability | End-to-end request tracking | UUID (X-Request-ID) |

## Development & Deployment Scripts

```json
{
  "dev": "nodemon src/server.js",    // Development with auto-reload
  "start": "node src/server.js",     // Production start
  "test": "jest --config ..."        // Automated test suite
}
```

## Architecture Benefits

✅ **Security-First:** Multi-layer defense (Headers, Scanner, IP Blocking, RBAC)  
✅ **Data Consistency:** Atomic transactions in service layer  
✅ **High Performance:** DB indexing and TTL caching  
✅ **Observability:** Request ID tracking + Structured Winston JSON logging  
✅ **Testability:** Mock-ready service architecture with >30 automated test cases  
✅ **Maintainability:** Strict separation between Routes, Controllers, Services, and Models