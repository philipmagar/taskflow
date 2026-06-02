# TaskFlow API — Logging Policy

> **Version:** 1.1.0
> **Last Updated:** 2026-06-02
> **Owner:** Platform / Backend Team
> **Reference:** [`src/utils/logger.js`](src/utils/logger.js)

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Purpose](#1-purpose) |
| 2 | [Logging Stack](#2-logging-stack) |
| 3 | [Logger Architecture](#3-logger-architecture) |
| 4 | [Log Levels](#4-log-levels) |
| 5 | [Log Domains (Child Loggers)](#5-log-domains-child-loggers) |
| 6 | [Log File Layout](#6-log-file-layout) |
| 7 | [Structured Log Format](#7-structured-log-format) |
| 8 | [Standard Fields](#8-standard-fields) |
| 9 | [Authentication Event Catalogue](#9-authentication-event-catalogue) |
| 10 | [Task Event Catalogue](#10-task-event-catalogue) |
| 11 | [Error Event Catalogue](#11-error-event-catalogue) |
| 12 | [HTTP Request Logging](#12-http-request-logging) |
| 13 | [Startup & Shutdown Logging](#13-startup--shutdown-logging) |
| 14 | [Retention & Rotation Policy](#14-retention--rotation-policy) |
| 15 | [PII & Sensitive Data Rules](#15-pii--sensitive-data-rules) |
| 16 | [Environment Differences](#16-environment-differences) |
| 17 | [Adding New Log Events](#17-adding-new-log-events) |

---

## 1. Purpose

This document defines the **authoritative logging standards** for the TaskFlow API.
Consistent, structured logging enables:

- Rapid incident diagnosis and root-cause analysis
- Event correlation across requests using `requestId`
- Security audit trails for authentication and data-mutation events
- Capacity planning via log-based metrics
- Real-time alerting through Prometheus / Grafana integrations

---

## 2. Logging Stack

| Component | Package | Version | Role |
|-----------|---------|---------|------|
| Core logger | `winston` | ^3.19.0 | Structured logging engine |
| Log rotation | `winston-daily-rotate-file` | ^5.0.0 | Daily file rotation + compression |
| HTTP access | `morgan` | ^1.10.1 | Dev-only colourised HTTP log lines |

---

## 3. Logger Architecture

The logger module (`src/utils/logger.js`) exports a **root logger** with **domain child loggers** attached as named properties. Every logger uses the same format and transport configuration but writes to its own dedicated log file.

```
src/utils/logger.js
│
├── logger              ← Root logger  (general / startup / shutdown)
│   ├── Transports: Console, combined.log, error.log
│
├── logger.auth         ← Auth domain  (JWT, login, role checks)
│   ├── Transports: Console, combined.log, error.log, auth.log
│
├── logger.task         ← Task domain  (CRUD events)
│   ├── Transports: Console, combined.log, error.log, task.log
│
└── logger.http         ← HTTP domain  (request/response pairs)
    └── Transports: Console, combined.log
```

**Import pattern:**
```js
const logger = require('../utils/logger');

// Root logger
logger.info('Server started');

// Domain child loggers
logger.auth.warn('Invalid token');
logger.task.info('Task created');
logger.http.http('GET /api/v1/tasks 200 12ms');
```

---

## 4. Log Levels

Winston uses npm log levels. **Lower number = higher priority.**

| Level | Priority | When to Use |
|-------|----------|-------------|
| `error` | 0 | Unhandled exceptions, programmer errors, DB failures |
| `warn` | 1 | Operational failures, auth denials, rate-limit hits |
| `info` | 2 | Normal lifecycle events (server ready, login success, task created) |
| `http` | 3 | HTTP request / response pairs |
| `debug` | 4 | Detailed diagnostic info — **development & staging only** |

>  **Rule:** Never use `error` for expected business-logic conditions — use `warn` instead.

---

## 5. Log Domains (Child Loggers)

Each domain writes to both the shared files and its own dedicated file:

| Domain | Logger property | Dedicated log file | Retention |
|--------|-----------------|--------------------|-----------|
| General / Startup | `logger` | *(none — combined only)* | 14 days |
| Authentication | `logger.auth` | `logs/auth-YYYY-MM-DD.log` | **30 days** |
| Task CRUD | `logger.task` | `logs/task-YYYY-MM-DD.log` | 14 days |
| HTTP Requests | `logger.http` | *(none — combined only)* | 14 days |

>  Auth logs are retained for **30 days** for security compliance.

---

## 6. Log File Layout

The `logs/` directory is **auto-created** on server startup if it does not exist.

```
logs/
├── combined-YYYY-MM-DD.log     # All levels, all domains
├── combined-YYYY-MM-DD.log.gz  # Compressed rotated copies
├── error-YYYY-MM-DD.log        # Errors only (level: error)
├── auth-YYYY-MM-DD.log         # Authentication events only
├── task-YYYY-MM-DD.log         # Task CRUD events only
├── .combined-audit.json        # DailyRotateFile rotation metadata
├── .error-audit.json
├── .auth-audit.json
├── .task-audit.json
└── .gitkeep                    # Ensures folder is tracked in git
```

> Audit `.json` files are managed by `winston-daily-rotate-file`. Do **not** delete them manually.

---

## 7. Structured Log Format

### 7.1 Production — JSON (all file transports)

Every log line in files is a **single-line JSON object**, enabling native parsing by log-shipping tools (Elasticsearch, Loki, CloudWatch, Datadog).

```json
{
  "level": "info",
  "message": "Task created",
  "timestamp": "2026-06-02T03:45:12.000Z",
  "service": "taskflow-api",
  "env": "production",
  "domain": "task",
  "event": "task.create.success",
  "requestId": "a1b2c3d4-0000-0000-0000-000000000000",
  "userId": 42,
  "taskId": 101,
  "title": "Design homepage"
}
```

### 7.2 Development — Colourised Text (console only)

```
2026-06-02 08:55:21 [auth] rid=a1b2c3d4 info: Token verified – access granted {"userId":42,"role":"user"}
2026-06-02 08:55:22 [task] rid=a1b2c3d5 info: Task created {"taskId":101,"title":"Design homepage"}
2026-06-02 08:55:23 error: UNCAUGHT EXCEPTION – shutting down {"error":"...","stack":"..."}
```

---

## 8. Standard Fields

Every log entry **MUST** include these fields where applicable:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | `string` | Always | Winston log level |
| `message` | `string` | Always | Short human-readable summary |
| `timestamp` | ISO-8601 | Always | UTC time of the event |
| `service` | `string` | Always | Always `"taskflow-api"` |
| `env` | `string` | Always | `development` \| `production` \| `test` |
| `event` | `string` | Always | Dot-notation event name (see §9–13) |
| `requestId` | UUID | Per-request | Correlation ID from `requestId.middleware` |
| `userId` | `number` \| `"unauthenticated"` | Per-request | Authenticated user ID if known |
| `ip` | `string` | Per-request | Client originating IP address |

---

## 9. Authentication Event Catalogue

All auth events use **`logger.auth`** and automatically carry `domain: "auth"`.

### 9.1 Protect Middleware (`auth.middleware.js`)

| Event Name | Level | Trigger Condition |
|------------|-------|-------------------|
| `auth.protect.no_token` | `warn` | No `Authorization: Bearer` header on protected route |
| `auth.protect.invalid_token` | `warn` | JWT signature invalid or token tampered |
| `auth.protect.invalid_token` *(expired)* | `warn` | Token syntactically valid but past `exp` claim |
| `auth.protect.success` | `info` | Token verified, `req.user` populated |
| `auth.protect.error` | `error` | Unexpected exception thrown inside `protect` |

### 9.2 Role Check Middleware (`auth.middleware.js`)

| Event Name | Level | Trigger Condition |
|------------|-------|-------------------|
| `auth.restrictTo.denied` | `warn` | User's role not in the allowed list |
| `auth.restrictTo.success` | `info` | Role check passed, request continues |

### 9.3 Login Controller (`auth.controller.js`)

| Event Name | Level | Trigger Condition |
|------------|-------|-------------------|
| *(implicit warn)* `Blocked login attempt blocked` | `warn` | IP blocked by `securityTracker` |
| *(implicit warn)* `Failed login attempt` | `warn` | Wrong email or password |
| `User logged in successfully` | `info` | Credentials valid, JWT issued |

---

## 10. Task Event Catalogue

All task events use **`logger.task`** and automatically carry `domain: "task"`.

| Event Name | Level | HTTP Verb & Route | Trigger |
|------------|-------|-------------------|---------|
| `task.list.success` | `info` | `GET /api/v1/tasks` | Task list returned successfully |
| `task.get.success` | `info` | `GET /api/v1/tasks/:id` | Single task retrieved |
| `task.create.success` | `info` | `POST /api/v1/tasks` | New task persisted to DB |
| `task.update.noop` | `warn` | `PATCH /api/v1/tasks/:id` | Request body had no valid updatable fields |
| `task.update.success` | `info` | `PATCH /api/v1/tasks/:id` | Task fields updated successfully |
| `task.delete.success` | `info` | `DELETE /api/v1/tasks/:id` | Task removed from DB |

---

## 11. Error Event Catalogue

### 11.1 Global Error Handler (`error.middleware.js`)

All error events use the root **`logger`**.

| Event Name | Level | Trigger |
|------------|-------|---------|
| `error.operational` | `warn` | `AppError` instance with `isOperational: true` |
| `error.programmer` | `error` | Unexpected error — `isOperational` is `false` or missing |
| `error.unclassified` | `error` | Any unhandled error in the **development** environment |

### 11.2 Process-Level Events (`server.js`)

| Event Name | Level | Trigger |
|------------|-------|---------|
| `uncaughtException` | `error` | `process.on('uncaughtException')` fires |
| `unhandledRejection` | `error` | `process.on('unhandledRejection')` fires |

---

## 12. HTTP Request Logging

`requestLogger.middleware.js` emits an `http`-level entry **after** every response is flushed (on `res.finish`):

```json
{
  "level": "http",
  "message": "HTTP Request",
  "requestId": "a1b2c3d4-...",
  "method": "POST",
  "url": "/api/v1/tasks",
  "status": 201,
  "duration": "34ms",
  "userId": 42,
  "ip": "::1"
}
```

Additionally, `morgan("dev")` is active in **development** for a colourised one-liner in the terminal:

```
POST /api/v1/tasks 201 34ms - 98b
```

---

## 13. Startup & Shutdown Logging

`server.js` emits lifecycle events using the root `logger`:

| Event Name | Level | When Emitted |
|------------|-------|--------------|
| `startup_begin` | `info` | `startServer()` is called |
| `db_connect_attempt` | `info` | Before `pool.getConnection()` |
| `db_connect_success` | `info` | DB connection established |
| `server_ready` | `info` | HTTP server is listening (includes port, URL, health endpoint) |
| `startup_error` | `error` | DB or port-bind failure — process exits |
| `shutdown_initiated` | `info` | `SIGTERM` or `SIGINT` received |
| `shutdown_timeout` | `warn` | Graceful shutdown did not complete within 10 s |
| `db_pool_closed` | `info` | Connection pool drained cleanly |
| `db_pool_close_error` | `error` | Pool failed to close during shutdown |

---

## 14. Retention & Rotation Policy

| Log File | Max Size / File | Retention | Compressed |
|----------|-----------------|-----------|------------|
| `combined-*.log` | 10 MB | 14 days | ✅ gzip |
| `error-*.log` | 5 MB | 14 days | ✅ gzip |
| `auth-*.log` | 5 MB | **30 days** | ✅ gzip |
| `task-*.log` | 10 MB | 14 days | ✅ gzip |

**Rules:**
- Files rotate at **midnight UTC** (date pattern: `YYYY-MM-DD`).
- Once a file exceeds the `maxSize`, it is immediately rotated mid-day.
- Compressed `.gz` archives are automatically cleaned after the retention window.
- Audit metadata files (`.json`) must **not** be deleted manually.

---

## 15. PII & Sensitive Data Rules

| Data Type | Allowed in Logs? | Guidance |
|-----------|-----------------|---------|
| User ID (integer) | ✅ Always | Safe numeric identifier — always include |
| Email address | ⚠️ Warn only | Log only on **failed** auth; never at `info` or `debug` |
| Full name | ❌ Never | Unnecessary — use `userId` |
| Password (plaintext) | ❌ Never | Forbidden in all environments |
| Password hash | ❌ Never | Still considered sensitive |
| JWT token string | ❌ Never | Log decoded `userId` and `role` only |
| IP address | ✅ Always | Required for security audit trails |
| Request body values | ⚠️ Filtered | Log field **names** only — never raw user-supplied values |
| Stack traces | ✅ Files only | Never expose in HTTP responses (production) |

**Enforcement in code:**
- `filterObj()` in `task.controller.js` ensures only whitelisted field *names* are logged.
- Auth middleware logs only `userId` and `role` from decoded JWT — never the raw token.

---

## 16. Environment Differences

| Behaviour | Development | Test | Production |
|-----------|-------------|------|------------|
| Console format | Colourised text | Silent (Jest) | JSON |
| Active log level | `debug` | `warn` | `info` |
| Morgan HTTP lines | ✅ Active | ❌ Off | ❌ Off |
| Stack in HTTP response | ✅ Yes | ❌ No | ❌ No |
| Stack in log files | ✅ Yes | ✅ Yes | ✅ Yes |
| `logs/` auto-created | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 17. Adding New Log Events

Follow this checklist whenever you add logging to a new feature:

1. **Choose the right logger**
   - Use `logger` for general/startup events
   - Use `logger.auth` for any authentication or authorization logic
   - Use `logger.task` for any task data operation
   - Create a new child logger for a brand new domain (e.g., `logger.order`)

2. **Select the correct level** — see §4

3. **Name the event** using dot-notation `<domain>.<action>.<outcome>`:
   ```
   order.create.success
   order.payment.failed
   auth.logout.success
   ```

4. **Include standard fields** — see §8 for the required field list

5. **Add it to this document** — update the relevant event catalogue section (§9–13)

6. **Never log secrets** — review §15 before merging

---

*This document is the authoritative logging reference for all TaskFlow API contributors.*
*For questions, contact the Platform / Backend Team.*
