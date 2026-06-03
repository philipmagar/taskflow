#  TaskFlow API

A robust, secure, and scalable Task Management API built with Node.js, Express, and MySQL. TaskFlow follows a [Clean Architecture](ARCHITECTURE.md) to provide a seamless experience for user authentication and task CRUD operations with advanced querying capabilities.

---

##  Key Features

- ** Secure Authentication**: JWT-based stateless authentication with password hashing (bcryptjs).
- ** RBAC (Role-Based Access Control)**: Restrict access to specific routes based on user roles (e.g., Admin only routes).
- ** Advanced Task Management**: Complete CRUD functionality with ownership protection.
- ** Powerful Query Engine**:
  - **Filtering**: Filter tasks by status (e.g., `?status=pending`).
  - **Sorting**: Multi-column sorting support (e.g., `?sort=-created_at`).
  - **Pagination**: Efficient data retrieval with `page` and `limit`.
- ** Enterprise Security**:
  - **Helmet**: Secure HTTP headers to prevent XSS and clickjacking.
  - **Rate Limiting**: Brute-force protection for all API endpoints.
  - **CORS**: Restricted origins for production security.
  - **Input Validation**: Strict validation using `express-validator`.
- ** Hardened Containerization**:
  - **Multi-Stage Docker Build**: Lean `node:18-alpine` image with production-only dependencies (161 MB).
  - **Non-Root User**: Container runs as `appuser:appgroup` — no UID 0.
  - **Read-Only Filesystem**: Root FS is read-only; only `/tmp` and `logs/` writable via `tmpfs`.
  - **No New Privileges**: `security_opt: no-new-privileges:true` on all services.
  - **Resource Limits**: App container capped at 512 MB RAM / 0.5 CPU.
- ** Error Handling**: Centralized global error handling with custom `AppError` class and async wrappers.
- ** Structured Logging**: Domain-isolated Winston child loggers (`auth`, `task`, `http`) with daily rotation, gzip compression, and JSON output in production. See [`LOGGING_POLICY.md`](LOGGING_POLICY.md) for the full logging standard.
- ** Performance Load Testing**: Advanced performance profiling and concurrency testing using `k6` targeting authentication and protected task routes, with a dedicated Grafana dashboard for real-time visualization of latency percentiles, throughput, and error rates.

---

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2` connection pooling)
- **Validation**: Express Validator
- **Logging**: Winston (structured JSON) + Morgan (dev HTTP) + `winston-daily-rotate-file` (rotation & compression)
- **Load Testing**: Grafana k6
- **Environment**: Dotenv
- **Containerization**: Docker (multi-stage, Alpine) & Docker Compose

---

##  Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/philipmagar/taskflow.git
   cd taskflow-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:
   The application uses environment-specific `.env` files. Create the following files in the root directory:

   **`.env`** (for Docker Compose and local overrides):
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=db
   DB_USER=root
   DB_PASSWORD=REMOVED
   DB_NAME=taskflow_db
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=1d
   MYSQL_ROOT_PASSWORD=REMOVED
   MYSQL_DATABASE=taskflow_db
   ```

   **`.env.development`** (for local development, connecting to Docker DB on port 3307):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3307
   DB_USER=root
   DB_PASSWORD=rootpassword
   DB_NAME=taskflow_db
   JWT_SECRET=REMOVED
   JWT_EXPIRES_IN=1d
   NODE_ENV=development
   ```

   **`.env.test`** (for running tests):
   ```env
   PORT=5001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_test_password
   DB_NAME=taskflow_test_db
   JWT_SECRET=your_test_secret_key
   JWT_EXPIRES_IN=1h
   NODE_ENV=test
   ```

   **`.env.production`** (template for production):
   ```env
   PORT=5000
   DB_HOST=your_prod_db_host
   DB_USER=your_prod_db_user
   DB_PASSWORD=your_prod_db_password
   DB_NAME=taskflow_db
   JWT_SECRET=your_secure_prod_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   ```

   The application uses a **Centralized Config Loader** (`src/config/config.js`) to automatically load the correct file based on the `NODE_ENV` environment variable.

4. **Database Setup**:
   - Ensure MySQL is running (XAMPP/Docker).
   - Create a database named `taskflow_db`.
   - The tables will be synchronized based on the models (Users & Tasks).

5. **Run the server**:

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

6. **Run Tests**:

   ```bash
   # Run all automated tests
   npm test
   ```

    You can also run the entire application (API and Database) via Docker:
   ```bash
   # Build the hardened production image
   npm run docker:build

   # Start API + MySQL in the background
   npm run docker:up

   # Tail live application logs
   npm run docker:logs

   # Stop and remove containers
   npm run docker:down
   ```

   **Viewing the Services**
   Once Docker Compose is running, you can access:
   - **TaskFlow API:** `http://localhost:5000/api/v1/health`
   - **Prometheus (Metrics):** `http://localhost:9090`
   - **Grafana (Live Dashboards):** `http://localhost:3000` *(Login: admin / admin)*
     - *Note: Includes the **TaskFlow — K6 Load Test Dashboard** for real-time k6 visual performance profiling.*
   - **Alertmanager (Notifications):** `http://localhost:9093`

   > **Security note:** The container runs as a non-root user (`appuser`), with a read-only root filesystem and no-new-privileges enforced.


---

##  API Endpoints (v1)

### Health

| Method | Endpoint           | Description              |
| :----- | :----------------- | :----------------------- |
| GET    | `/api/v1/health`   | API health check         |
| GET    | `/metrics`         | Prometheus metrics       |

### Auth & Users

| Method | Endpoint                | Description                   |
| :----- | :---------------------- | :---------------------------- |
| POST   | `/api/v1/auth/register` | Register a new user           |
| POST   | `/api/v1/auth/login`    | Login and receive JWT         |
| POST   | `/api/v1/users`         | Admin: Create a user manually |

### Tasks (Protected)

| Method | Endpoint                   | Description                                    |
| :----- | :------------------------- | :--------------------------------------------- |
| GET    | `/api/v1/tasks`            | Get all user tasks (supports sort/filter/page) |
| POST   | `/api/v1/tasks`            | Create a new task                              |
| GET    | `/api/v1/tasks/:id`        | Get single task details                        |
| PATCH  | `/api/v1/tasks/:id`        | Update task title/description                  |
| PATCH  | `/api/v1/tasks/:id/status` | Update task status specifically                |
| DELETE | `/api/v1/tasks/:id`        | Delete a task                                  |

---

##  Logging

TaskFlow uses a **domain-isolated Winston logging system** defined in [`src/utils/logger.js`](src/utils/logger.js). All logging standards are documented in [`LOGGING_POLICY.md`](LOGGING_POLICY.md).

### Logger Architecture

```
logger              → Root logger  (startup / shutdown / general)
logger.auth         → Auth domain  (JWT, login, role-checks)         → logs/auth-*.log
logger.task         → Task domain  (CRUD events)                     → logs/task-*.log
logger.http         → HTTP domain  (request/response pairs)          → logs/combined-*.log
```

### Log Files

| File | Contents | Retention |
|------|----------|-----------|
| `logs/combined-YYYY-MM-DD.log` | All levels, all domains | 14 days |
| `logs/error-YYYY-MM-DD.log` | Errors only | 14 days |
| `logs/auth-YYYY-MM-DD.log` | Auth events only | **30 days** |
| `logs/task-YYYY-MM-DD.log` | Task CRUD events only | 14 days |

> Files are **gzip-compressed** on rotation and auto-cleaned after the retention window.
> The `logs/` directory is created automatically on startup.

### Log Levels

| Level | When Used |
|-------|-----------|
| `error` | Uncaught exceptions, DB failures, programmer errors |
| `warn` | Auth denials, rate-limit hits, operational errors |
| `info` | Server ready, login success, task created/updated/deleted |
| `http` | Every inbound HTTP request (method, status, duration) |
| `debug` | Verbose diagnostics — development only |

### Production Log Sample (JSON)

```json
{
  "level": "info",
  "message": "Task created",
  "timestamp": "2026-06-02T03:45:12.000Z",
  "service": "taskflow-api",
  "env": "production",
  "domain": "task",
  "event": "task.create.success",
  "requestId": "a1b2c3d4-...",
  "userId": 42,
  "taskId": 101
}
```

### Development Log Sample (Colourised)

```
2026-06-02 08:55:21 [auth] rid=a1b2c3d4 info: Token verified – access granted {"userId":42,"role":"user"}
2026-06-02 08:55:22 [task] rid=a1b2c3d5 info: Task created {"taskId":101}
```

### Reading Logs

```bash
# Tail all live logs
tail -f logs/combined-$(date +%F).log

# Filter errors only
grep '"level":"error"' logs/combined-$(date +%F).log | jq .

# Trace a single request by ID
grep 'a1b2c3d4' logs/combined-$(date +%F).log

# View auth events only
tail -f logs/auth-$(date +%F).log
```

> Full logging policy including PII rules, event catalogues, and retention details: [`LOGGING_POLICY.md`](LOGGING_POLICY.md)

---

##  Load Testing

TaskFlow features a comprehensive performance profiling and load testing suite built with **Grafana k6**. It includes targeted testing scripts for authentication, end-to-end task operations, and sudden traffic surges (spike testing), along with a dedicated Grafana dashboard for real-time visualization of metrics.

### Test Scenarios

| Test Script | Description | Configuration / Load Profile | Target Endpoints |
| :--- | :--- | :--- | :--- |
| [`auth-load.js`](tests/load/auth-load.js) | Authentication Stress Test | Concurrency ramp up to 50 VUs | `POST /api/v1/auth/login` |
| [`tasks-load.js`](tests/load/tasks-load.js) | Full API Load Profile | Staged test: 10 VUs (warm-up) → 50 VUs (sustained) → 100 VUs (spike) → cool-down | Auth + Health + Task CRUD (`GET`, `POST`, `GET :id`, `PATCH`, `DELETE`) |
| [`spike-test.js`](tests/load/spike-test.js) | Resilience & Recovery | Instant spike to 200 VUs for 1 minute | `/api/v1/health` |

### Running the Load Tests

#### 1. Local execution (Standard Console Output)

To run a test and print results directly in your terminal, ensure the API server is running (`npm run dev`) and execute:

```bash
# Run the complete task load profile
k6 run tests/load/tasks-load.js

# Run the auth stress test
k6 run tests/load/auth-load.js

# Run the resilience spike test
k6 run tests/load/spike-test.js
```

#### 2. Streaming Metrics to Grafana (via InfluxDB)

To stream metrics in real time to the provided Grafana dashboard, you need to spin up an InfluxDB container on the same network:

1. **Start InfluxDB** (v1.8 is recommended for native k6 integration):
   ```bash
   docker run -d -p 8086:8086 --name influxdb --network taskflow-network influxdb:1.8
   ```

2. **Execute k6 with InfluxDB Output**:
   ```bash
   k6 run -o influxdb=http://localhost:8086/k6 tests/load/tasks-load.js
   ```

3. **View Live Dashboard**:
   - Access Grafana at `http://localhost:3000`.
   - Go to **Dashboards** and select the **TaskFlow — K6 Load Test Dashboard**.
   - Watch real-time metrics including **Active VUs**, **Request Rate**, **Response Time Percentiles (avg, med, p95, p99)**, **Failure Rates**, and **Per-Endpoint Latencies**.

### Load Test Reports

Each test run automatically generates a detailed JSON report saved locally under:
`tests/load/reports/` (e.g., `tests/load/reports/load-test-report-YYYY-MM-DD-HH-MM-SS.json`).

---

##  Project Structure

```text
taskflow-api/
├── src/
│   ├── config/              # Database & app configuration (config.js, db.js)
│   ├── controllers/         # Request handling (auth, task, user, order)
│   ├── middlewares/         # Auth, error, request-logger, security, metrics
│   ├── migrations/          # SQL migration scripts (indexes, schema changes)
│   ├── models/              # MySQL query layer (User, Task)
│   ├── routes/              # API route definitions (auth, task, user, order)
│   ├── services/            # Business logic (TaskService, OrderService)
│   ├── utils/
│   │   ├── logger.js        # Winston root + child loggers (auth, task, http)
│   │   ├── apiResponse.js   # Standardized response helpers
│   │   ├── appError.js      # Custom AppError class
│   │   ├── catchAsync.js    # Async error wrapper
│   │   ├── cache.js         # In-memory TTL cache
│   │   ├── securityTrack.js # IP-based brute-force tracker
│   │   └── securityDetector.js # XSS / SQL injection scanner
│   ├── validators/          # express-validator schemas
│   ├── app.js               # Express app setup & middleware stack
│   └── server.js            # Entry point + lifecycle logging
├── logs/
│   ├── combined-YYYY-MM-DD.log  # All domains, all levels
│   ├── error-YYYY-MM-DD.log     # Errors only
│   ├── auth-YYYY-MM-DD.log      # Auth events (30-day retention)
│   ├── task-YYYY-MM-DD.log      # Task CRUD events
│   └── .gitkeep                 # Tracks folder in git
├── docker/
│   ├── mysql/init/          # MySQL initialization SQL
│   └── grafana/             # Grafana configurations
│       └── dashboards/      # Dashboards directory
│           └── k6-load-test-dashboard.json # K6 load test visualization
├── tests/                   # Unit, integration, and load test suites
│   ├── factories/           # Test factories
│   ├── integration/         # Integration test suites
│   ├── load/                # K6 performance load scripts
│   │   ├── auth-load.js     # Auth stress test
│   │   ├── spike-test.js    # Traffic surge resilience test
│   │   └── tasks-load.js    # Comprehensive staged load test
│   ├── unit/                # Unit test suites
│   └── setup.js             # Test database setup and cleaner
├── .dockerignore            # Files excluded from Docker build context
├── docker-compose.yml       # Multi-service orchestration (app + db + monitoring)
├── Dockerfile               # Multi-stage hardened build
├── ARCHITECTURE.md          # Detailed architecture documentation
├── LOGGING_POLICY.md        # Logging standards, event catalogues, PII rules
├── DISASTER_RECOVERY.md     # DB backup & restore procedures
├── .env                     # Environment variables (Docker Compose)
└── package.json             # Dependencies & npm scripts
```

---

##  Development Timeline

#### Day 1: Backend Foundation Setup

- Node.js + Express installed
- Clean architecture folder structure
- Environment variables configured
- API versioning (`/api/v1`) working

#### Day 2: Database Integration

- MySQL setup (XAMPP)
- Database `taskflow_db` created
- Connection pooling using `mysql2`
- Database config separated in `config/db.js`
- Server starts only after successful DB connection

#### Day 3: Create Users Table

- Designing a proper users table
- Applying database constraints
- Understanding `UNIQUE` and `ENUM`
- Creating the User Model
- Connecting application logic to MySQL

#### Day 4: Create Controllers and Models

- Implement `POST /api/v1/users` endpoint
- Add User model with `create` and `findByEmail` methods
- Connect to MySQL database using connection pooling

#### Day 5: Input Validation (Joi)

- Valid email format
- Minimum password length
- Restricted role values
- Clean separation of concerns using middleware

#### Day 6: User Authentication & Error Handling

- Implemented centralized error handling with `AppError` class
- Added async wrapper (`catchAsync`)
- Added Nodemon for development
- Tested responses in Thunder Client

#### Day 7: Input Validation with Express Validator

- Switched from Joi to `express-validator`
- Integrated validation error responses with `AppError`
- Created reusable validation middleware

#### Day 8: Debugging and Request Logging

- Add request logging with `morgan`
- Handle unhandled crashes
- Improve error visibility

#### Day 9-11: Auth & Role Based Access Control (RBAC)

- Secure password hashing with bcryptjs
- Stateless JWT authentication
- Implemented `protect` and `restrictTo` middlewares
- Admin-only route testing

#### Day 12-16: Task CRUD System

- Designed tasks table with foreign key relationship
- Implemented Task Model and Controller
- Added ownership authorization checks
- Completed Create, Read (Single/All), Update, and Delete operations

#### Day 17-21: Advanced Querying & Filtering

- Added query filtering by status
- Implemented multi-column sorting (`?sort=-created_at`)
- Added pagination support (`?page=1&limit=10`)
- Built a unified dynamic query engine
- Added specialized `PATCH /tasks/:id/status` endpoint

#### Day 22-23: Security Hardening

- Installed and configured `helmet` for HTTP headers
- Added `express-rate-limit` for DDoS/Brute-force protection
- Configured CORS and request body size limits

#### Day 24: Centralized Logging with Winston

- Integrated `winston` for systematic application logging
- Created a custom logger utility (`src/utils/logger.js`)
- Configured log rotation for errors (`error.log`) and combined logs (`combined.log`)
- Replaced basic `console.error` with `logger.error` in global error handler
- Added colorized console output for development environment

#### Day 25: Custom Request Logging Middleware

- Implemented a custom request logging middleware using the `winston` logger.
- Captured essential request details including HTTP method, URL, status code, duration, IP address, and user identity.
- Integrated the custom logger into the application's top-level middleware stack for comprehensive traffic visibility.
- Replaced basic logging with detailed, structured logs for better monitoring and debugging.

#### Day 26: Security Tracking and Brute-force Protection

- Implemented an IP-based security tracker (`src/utils/securityTrack.js`) to record failed login attempts.
- Added logic to block access for 15 minutes after 5 failed attempts from the same IP address.
- Refactored login controller to use the new tracker and improved security by removing sensitive information from logs.
- Integrated `isBlocked` middleware-like logic for enhanced brute-force defense.


#### Day 27: Sorting, Pagination, and Request Hardening

- Added a sorting whitelist and dynamic ORDER BY logic to the Task model.
- Implemented pagination limits to prevent database overloading.
- Integrated `helmet` middleware for essential HTTP security headers.
- Enhanced input validation and sanitization using `express-validator`.
- Verified security against unauthorized role escalation during registration.

#### Day 28: Security Hardening & API Consistency

- Installed and configured `hpp` (HTTP Parameter Pollution) middleware for protection against multi-parameter attacks.
- Secured production error responses to strictly prevent leaking internal stack traces or database details.
- Standardized API response formats with a consistent `status`, `message`, and `data` structure.
- Strengthened input validation for tasks with dedicated `express-validator` schemas.
- Implemented robust mass assignment prevention using object filtering in the Task controller.
- Refactored validation middleware into a reusable handler to improve code modularity.

#### Day 29: Input Security & Suspicious Activity Detection

- Developed a central `securityDetector` utility to scan inputs for common attack patterns (XSS, SQL Injection).
- Implemented `securityMiddleware` to automatically scan `req.body` and `req.query` for all incoming requests.
- Integrated structured logging for suspicious activities using the `winston` logger.
- Configured the API to block requests containing malicious payloads with a 400 Bad Request response.

#### Day 30: Automated IP Blocking & Suspicious Activity Tracking

- Refactored `securityTrack.js` for reliable IP-based event recording and 15-minute temporary blocks.
- Updated `securityMiddleware` to automatically track suspicious inputs (XSS/SQLi) towards IP blocking.
- Standardized 403 Forbidden responses for blocked IPs with descriptive messaging.
- Enhanced security logging to include attempt counts and specific block reasons for better auditability.

#### Day 31: Structured Request Tracking (Request ID)

- Installed `uuid` for unique request identification.
- Implemented `requestIdMiddleware` to generate and assign a unique ID to every incoming request.
- Configured `X-Request-ID` header in all API responses for client-side tracking.
- Unified logging across all middlewares (`requestLogger`, `securityMiddleware`, and `errorMiddleware`) to include the `requestId`.
- Fixed syntax errors and refined production-ready error logging for better traceability.
- Ensured middleware execution order for consistent metadata availability.

#### Day 32: Structured Logging System

- Environment-aware logging
- Readable dev logs
- Production JSON logs

#### Day 34: Logging Refinement & Disk Protection

- Refined log rotation configuration with specific `auditFile` management.
- Implemented strict error log separation and retention verification.
- Verified disk overflow prevention with compressed archives (`zippedArchive`).
- Updated internal policies for log metadata organization.

#### Day 35: Service Layer Implementation & Controller Refactoring

- Introduced a dedicated `TaskService` in `src/services/task.service.js` to handle business logic.
- Decoupled `TaskController` from direct database model interactions.
- Simplified controller methods to focus on request validation and response handling.
- Enhanced internal security by centralizing task ownership verification in the service layer.
- Fixed syntax and logging errors in the Task controller for improved stability.

#### Day 36: Transaction System & Data Consistency

- Implemented atomic transactions for task creation and deletion.
- Ensured data consistency by syncing `users.task_count` with the number of tasks.
- Refactored `TaskService` to use a unified transactional approach.
- Implemented automatic rollback for failed multi-table operations.

#### Day 37: Concurrency Optimization & Race Condition Prevention

- Refined the transaction system in `TaskService` by introducing explicit row-level database locking (`SELECT ... FOR UPDATE`).
- Protected data integrity (e.g., `users.task_count` synchronization) from concurrency issues and race conditions during rapid multi-request task creation and deletion.
- Removed redundant transactional methods to achieve a single robust handler.
- Verified stable api performance and atomic data precision under high-concurrency request testing.

#### Day 38: Order Management System

- Designed and integrated an order management system including routes, controllers, and services.
- Added `order.routes.js` for routing.
- Added `order.control.js` for handling order logic.
- Added `order.service.js` for business logic separation and consistency.
- Updated `app.js` to initialize the order routes and modularize API endpoints.

#### Day 39: Code Refactoring & De-duplication

- Fixed an anomalous nested function definition (`getTasks`) within the `deleteTask` service method.
- Cleaned up conflicting and duplicated `getTasks` controller definitions.
- Ensured `TaskModel.getTasksAdvanced` is correctly linked to the new request handling logic.

#### Day 40: Global API Response System

- Created a reusable `apiResponse` utility (`src/utils/apiResponse.js`) with `success()` and `error()` helpers.
- Standardized all API responses to follow a consistent `{ status, message, data }` structure.
- Refactored all controllers (task, auth, user, order) to use the new response utility.
- Added a `GET /api/v1/health` endpoint for basic service monitoring.
- Fixed a missing leading slash on the orders route (`/api/v1/orders`).

#### Day 41: Database Performance Optimization

- Added database indexes on frequently queried fields for faster query execution.
- Created `idx_tasks_user_id` index on `tasks(user_id)` for per-user task lookups.
- Created `idx_tasks_status` index on `tasks(status)` for status-based filtering.
- Created `idx_tasks_created_at` index on `tasks(created_at)` for date-based sorting.
- Created composite `idx_tasks_user_status` index on `tasks(user_id, status)` for combined query patterns.
- Added SQL migration script in `src/migrations/add_indexes.sql`.

#### Day 42: Basic Caching System

- Implemented an in-memory cache utility (`src/utils/cache.js`) with configurable TTL (time-to-live).
- Integrated caching into `getTasks` service to reduce repeated database queries.
- Cache key built from `userId` and query parameters for granular caching.
- Automatic cache invalidation on task create, update, and delete operations.
- Prefix-based cache clearing ensures stale data is never served.

#### Day 43: Automated Testing & Security Audit

- Standardized the testing environment with **Jest** and **Supertest**.
- Implemented a **Database Mocking** layer for isolated and reliable API testing.
- Created comprehensive test suites for **Health**, **Auth**, and **Task** modules.
- Developed a dedicated **Security Audit** suite covering:
  - **XSS Protection**: Validated blocking of`<script>` injections.
  - **SQL Injection**: Verified detection and blocking of malicious SQL patterns.
  - **Brute Force Protection**: Tested IP-based temporary blocking after excessive failures.
  - **Security Headers**: Verified proper configuration of 10+ essential headers via Helmet.
- Integrated **Babel** in `package.json` for seamless ESM/CommonJS module compatibility.
- Fixed critical application-level routing and dependency resolution bugs discovered during testing.

#### Day 45: Authentication Flow & Negative Scenario Testing

- Implemented comprehensive authentication flow testing in `tests/auth.flow.test.js`.
- Added negative test cases for user registration (duplicate emails, invalid formats).
- Added negative test cases for login (incorrect passwords, non-existent users).
- Verified protected route security (unauthorized access, invalid tokens).
- Fixed critical bugs in authentication middleware and user controllers:
  - Resolved typo in `bcrypt` usage in user controller.
  - Fixed missing `next()` calls and `req.user` attachment in `protect` middleware.
  - Integrated `dotenv` configuration for seamless test environment setup.
- Reached 100% test pass rate for the authentication module (42 total tests passing).



#### Day 47: Production-Level Testing Infrastructure

- Transitioned from mocked unit tests to a robust **Integration Testing** environment using a real test database (`taskflow_test_db`).
- Implemented automated **Database Cleaning** in `tests/setup.js` using `TRUNCATE` hooks for total test isolation.
- Configured **Jest Quality Gates**:
  - Sequential execution (`--runInBand`) to prevent database concurrency issues.
  - Coverage reporting with global thresholds (70%) for sustainability.
  - Silenced logging during tests for cleaner console output.
- Expanded test coverage across all layers:
  - **Task Integration**: End-to-end CRUD verification against the database.
  - **Auth Integration**: Real-world verification of registration, login, and brute-force protection.
  - **Order System**: New integration suite for order processing and stock management.
- Fixed critical production-level bugs identified during integration:
  - Synchronized missing `task_count` column and `products`/`orders` tables across environments.
  - Implemented 100% stable pass rate for 55+ automated tests.
  - Integrated `.env.test` for standardized environment management.

#### Day 48: Advanced Logic Verification & Stateful Mocking

- **Business Logic Verification**: Achieved 100% pass rate on core services (Task, Order) including transaction rollbacks and ownership checks.
- **Stateful Mock SQL Emulator**: Implemented a resilient testing environment in `tests/setup.js` that simulates a real database using in-memory state tracking.
- **Advanced Mocking Capabilities**: Added support for SQL Sorting, Pagination, and row-level Modification/Deletion within the mock layer.
- **Test Infrastructure Hardening**:
  - Introduced **Test Data Factories** (`tests/factories/`) for standardized and maintainable user/task generation.
  - Achieved high **Jest coverage thresholds**: Branches (82%+), Functions (88%+), and Statements (94%+).
- **Comprehensive Unit Testing**: Added dedicated suites for all controllers, services, models, and custom middlewares.

#### Day 50: 100% Test Coverage & Test Suite Refactoring

- **Test Folders Organized**: Systematically grouped test files into dedicated `unit/` and `integration/` subdirectories for better modularity and maintainability.
- **Helper Created**: Developed automated test generation tools, such as the User Factory (`tests/factories/`), to rapidly spin up valid contextual objects.
- **Duplicate Code Removed**: Greatly reduced boilerplate and DB-insertion repetition across test files by leveraging shared setups and unified helpers.
- **Naming Improved**: Standardized the naming conventions throughout the suite (distinguishing `*.unit.test.js` vs integration scopes) for faster debugging.
- **Coverage Verified**: Handled edge permutations globally (like cache instances and middleware branch checks) to verify and enforce a flawless **100% coverage threshold** across the API architecture.

#### Day 51: Containerization

- Added `.dockerignore` and `Dockerfile` to create a portable, optimized Node.js image.
- Implemented `docker-compose.yml` to orchestrate the Node.js API alongside a MySQL 8.0 database.
- Standardized a consistent runtime environment to guarantee identically reproduced builds.
- Verified API reachability and database connectivity within the containerized environment.

#### Day 52: Infrastructure Validation

- Successfully validated the Docker-based orchestration for both the backend and database services.
- Verified seamless database connectivity and established stable health-check responses.
- Confirmed API reachability on port 5000, ensuring the containerized environment is production-ready.

#### Day 54: Secure Configuration & Environment Management

- Implemented a **Centralized Config Loader** (`src/config/config.js`) to unify configuration management.
- Transitioned from a single `.env` file to **environment-specific files** (`.env.development`, `.env.test`, `.env.production`).
- Standardized error handling and logging to use the new configuration system.
- Fixed cross-environment casing issues for improved deployment reliability.

#### Day 55: Docker Environment Verification & Secret Removal

- Removed all hardcoded secrets from `docker-compose.yml` for enhanced security.
- Implemented `env_file` support in Docker Compose to load variables from a centralized `.env` file.
- Verified end-to-end container connectivity and database health in the orchestrated environment.
- Standardized the Docker setup to align with the environment-specific configuration system.

#### Day 56: Docker Networking & Troubleshooting Knowledge

- **Service Name Networking**: Understood how Docker Compose creates a default bridge network where containers can communicate using their service names (e.g., `DB_HOST=db` instead of `localhost`).
- **Container Connection Testing**: Verified that the API successfully waits for the MySQL service to be healthy (`service_healthy` condition) before attempting connection, preventing startup crashes.
- **Debug Commands Learned**:
  - `docker-compose logs -f app`: Monitor live application logs.
  - `docker-compose exec db mysql -u root -p`: Access the database directly inside the container.
  - `docker-compose ps`: Check status and health of all orchestrated services.
- **Common Errors Understood**:
  - `ECONNREFUSED`: Occurs when the app tries to connect before the database is ready.
  - Port Conflict: Handled by mapping external port 3307 to internal 3306 for local DB access without clashing with host MySQL instances.
  - Environment Sync: Ensured `.env` variables are correctly passed to containers via `env_file`.

#### Day 57: Docker Container Security Hardening

- **Multi-Stage Build**: Restructured `Dockerfile` into a `builder` stage (all deps) and a lean `production` stage (prod deps only), reducing the final image to **161 MB**.
- **Alpine Base Image**: Switched to `node:18-alpine` for a minimal OS attack surface.
- **Non-Root User**: Added a dedicated `appuser:appgroup` system account; the API process no longer runs as UID 0.
- **Read-Only Root Filesystem**: Set `read_only: true` in `docker-compose.yml`; writable paths (`/tmp`, `logs/`) provided via `tmpfs` mounts.
- **No New Privileges**: Applied `security_opt: no-new-privileges:true` to both the `app` and `db` services to block runtime privilege escalation.
- **Resource Limits**: Capped the app container at 512 MB memory and 0.5 CPU cores via `deploy.resources`.
- **Expanded `.dockerignore`**: Excluded `tests/`, `coverage/`, env files, docs, scratch scripts, and logs from the build context.
- **npm Scripts**: Added `docker:build`, `docker:logs` scripts to `package.json` alongside existing `docker:up` / `docker:down`.
- **Documentation**: Updated `ARCHITECTURE.md` with a full Container Security section reflecting all hardening measures.

#### Day 58-60: Comprehensive Application Security

- Added `cors` middleware to securely control cross-origin resource sharing.
- Configured `express-rate-limit` (100 req/15min) to protect endpoints against DDoS and brute-force attacks.
- Safely removed deprecated sanitization packages in favor of robust custom detection and HTTP Parameter Pollution (`hpp`) defenses.
- Verified API resilience under heavy load and malformed request integration tests.

#### Day 61-63: Continuous Integration (CI) Setup

- Authored GitHub Actions CI pipeline (`.github/workflows/ci.yml`).
- Configured automated test suite execution on every push and pull request.
- Implemented automated vulnerability scanning using `npm audit` to catch high-severity risks pre-merge.
- Validated multi-stage Docker image build capability (dry runs) within the CI environment.

#### Day 64-66: Continuous Deployment (CD) Setup

- Created GitHub Actions CD pipeline (`.github/workflows/cd.yml`) targeting main branch merges.
- Configured secure SSH actions (`appleboy/ssh-action`) to authenticate with Linux VPS.
- Automated code pulls, production dependency installations, and service reloads inside the deployment runner.
- Ensured automated and predictable zero-downtime deployment workflows.

#### Day 67-68: Production Server Infrastructure (NGINX)

- Built dedicated NGINX server configuration (`nginx/nginx.conf`).
- Configured automatic HTTP to HTTPS permanent redirection (301).
- Applied strict SSL/TLS parameters and injection of critical security headers (HSTS, X-Frame-Options, X-XSS-Protection).
- Established a secure reverse proxy to reliably route external traffic to the internal Node.js port (5000).

#### Day 69-70: Process Management (PM2)

- Designed `ecosystem.config.js` for PM2-based advanced process management.
- Configured application to run in cluster mode (`exec_mode: 'cluster'`) utilizing maximum available CPU instances.
- Standardized log formatting (`YYYY-MM-DD HH:mm Z`) and merged error/output streams into dedicated files.
- Hardcoded robust production environment variable injection during PM2 reloads.

#### Day 71: Finalizing Deployment Pipeline & Test Infrastructure

- Systematically resolved critical Jest parsing errors caused by malformed require statements across 15+ mock integration suites.
- Fixed environment variable collision issues in isolated error-handling tests that caused false negative 500s.
- Re-verified an absolute 100% pass rate (135/135 tests) in the context of CI/CD pipeline integration.
- The project successfully satisfies all holistic backend, security, testing, DevOps, CI/CD, and cloud infrastructure requirements.

#### Day 72: System Metrics and Prometheus Integration

- Installed `prom-client` to gather system and HTTP performance metrics.
- Added a custom metrics middleware to track `http_request_duration_seconds`.
- Exposed a public `/metrics` endpoint formatted for Prometheus scraping.
- Integrated a Prometheus Docker container within `docker-compose.yml` to securely collect application metrics.

#### Day 73: Grafana Integration and Live Monitoring

- Integrated Grafana container into the docker-compose orchestration.
- Configured automated provisioning for the Prometheus data source.
- Designed and provisioned a custom live monitoring dashboard for Node.js metrics (uptime, memory usage).
- Verified seamless networking between Prometheus, Grafana, and the Node.js API.

#### Day 74: Prometheus Alerting & Dashboard Integration

- Configured a dedicated `alerts.yml` rule file in Prometheus for critical system alerts.
- Added specific alert triggers for:
  - **API Downtime**: Triggers when the instance is completely unreachable.
  - **High Memory Usage**: Warns when resident memory exceeds 200MB.
  - **High CPU Usage**: Warns when CPU utilization crosses the 80% threshold.
  - **Slow Requests**: Detects average API latency spikes exceeding 1 second.
- Integrated an "Active Alerts" panel directly into the main Grafana dashboard to increase alert visibility.
- Verified volume mounting and rule loading from within the `docker-compose.yml` infrastructure.

#### Day 75: Alertmanager & Notification Routing

- Integrated the `alertmanager` container into the Docker Compose stack.
- Configured Prometheus (`prometheus.yml`) to route triggered alerts to the Alertmanager service on port 9093.
- Created an initial `alertmanager.yml` configuration for grouping, deduplicating, and routing notifications (e.g., Slack, Webhooks, Email).
- Verified live end-to-end alerting visibility via the browser.

#### Day 76: Database Backup & Disaster Recovery

- Created a dedicated `backup_test/backup.sh` script using `mysqldump` to automatically back up the database container data.
- Built a `restore.sh` script to easily recover database state from SQL dump files.
- Documented automated backup scheduling using `cron`.
- Added a comprehensive `DISASTER_RECOVERY.md` detailing step-by-step recovery scenarios (accidental deletion, volume corruption, complete host failure).

#### Day 77: Domain-Isolated Winston Logging System

- Rebuilt `src/utils/logger.js` with **domain child loggers** (`logger.auth`, `logger.task`, `logger.http`) so each domain writes to its own dedicated rotating file.
- **Auto-creates `logs/`** directory on startup — no manual folder setup required.
- Upgraded **`src/server.js`** with full startup lifecycle events: `startup_begin`, `db_connect_success`, `server_ready`, graceful SIGTERM/SIGINT shutdown with pool drain, and `shutdown_timeout` guard.
- Upgraded **`src/middlewares/auth.middleware.js`** to emit structured auth events: missing token, expired token, invalid token, successful auth, role denial — all via `logger.auth`.
- Upgraded **`src/controllers/task.controller.js`** to emit structured task events for every CRUD action via `logger.task`, including a `task.update.noop` warning when no valid fields are provided.
- Upgraded **`src/middlewares/error.middleware.js`** to classify errors as `error.operational`, `error.programmer`, or `error.unclassified` with a shared `buildErrorMeta()` helper providing `requestId`, `userId`, `ip`, method, URL, and stack trace on every entry.
- Auth logs retained for **30 days**; all log files gzip-compressed on rotation.
- Published **`LOGGING_POLICY.md`** — 17-section document covering levels, domains, event catalogues, PII rules, retention policy, environment differences, and contributor guidelines.

#### Day 78: K6 Load Testing & Performance Monitoring

- **k6 Load Testing Suite**: Configured k6 for performance profiling and load testing of auth and protected endpoints (`tests/load/`).
- **Test Scenarios**: Developed scripts for auth stress testing (`auth-load.js`), sudden spike resilience (`spike-test.js`), and staged full-API profiling (`tasks-load.js`).
- **Live Visual Metrics**: Integrated metrics collection with InfluxDB and Grafana, provisioning a dedicated K6 Load Test Dashboard.
- **Reports**: Auto-generates local execution JSON summaries on each performance run.

---


## License

This project is licensed under the **ISC License**.
