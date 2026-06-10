# TaskFlow API — Threat Model

> **Date:** 2026-06-10  
> **Methodology:** STRIDE + Risk Matrix  
> **Scope:** TaskFlow REST API, MySQL Database, Docker Infrastructure, CI/CD Pipeline, Frontend Client

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Assets Inventory](#2-assets-inventory)
3. [Threat Actors](#3-threat-actors)
4. [Attack Surface Mapping](#4-attack-surface-mapping)
5. [Trust Boundaries](#5-trust-boundaries)
6. [STRIDE Analysis](#6-stride-analysis)
7. [Risk Matrix](#7-risk-matrix)
8. [Recommendations Summary](#8-recommendations-summary)

---

## 1. System Overview

TaskFlow is a Node.js/Express REST API for task management backed by MySQL. The system uses JWT authentication, role-based access control (admin/member), in-memory caching, and is deployed via Docker Compose with Prometheus/Grafana monitoring.

### Data Flow

```
Client (Browser) → Nginx (TLS) → Express API (Port 5000) → MySQL (Port 3306)
                                       ↕                        ↕
                                  In-Memory Cache         Persistent Storage
                                       ↕
                              Prometheus → Grafana
```

---

## 2. Assets Inventory

| ID | Asset | Classification | Description |
|----|-------|---------------|-------------|
| A1 | User Credentials | **Critical** | Email + bcrypt-hashed passwords in `users` table |
| A2 | JWT Secret | **Critical** | Signing key (`JWT_SECRET` env var) for all auth tokens |
| A3 | Database Credentials | **Critical** | `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` in `.env` |
| A4 | JWT Tokens | **High** | Bearer tokens containing user ID and role |
| A5 | Task Data | **High** | User-created tasks (title, description, status) |
| A6 | User PII | **High** | Email addresses stored in `users` table |
| A7 | Application Logs | **Medium** | Winston logs containing IPs, user IDs, request details |
| A8 | API Source Code | **Medium** | Business logic, route definitions, security configs |
| A9 | CI/CD Secrets | **Critical** | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` in GitHub Secrets |
| A10 | Metrics Endpoint | **Medium** | Prometheus metrics at `/metrics` (unauthenticated) |

---

## 3. Threat Actors

| ID | Actor | Motivation | Capability | Target Assets |
|----|-------|-----------|------------|---------------|
| TA1 | **External Attacker** | Data theft, disruption | Moderate — automated scanners, known exploits | A1–A6 |
| TA2 | **Authenticated Malicious User** | Privilege escalation, data access | Low-Moderate — valid credentials, API knowledge | A4, A5, A6 |
| TA3 | **Insider / Compromised Developer** | Sabotage, data exfiltration | High — repo access, CI/CD secrets | A2, A3, A8, A9 |
| TA4 | **Supply Chain Attacker** | Backdoor insertion | High — compromised npm packages | A2, A3, A8 |
| TA5 | **Automated Bot** | Credential stuffing, DDoS | Low — volume-based attacks | A1, A5 |

---

## 4. Attack Surface Mapping

### 4.1 Network Endpoints

| Endpoint | Auth | Method | Risk |
|----------|------|--------|------|
| `POST /api/v1/users` | None | Registration | **High** — open endpoint, account creation |
| `POST /api/v1/auth/login` | None | Login | **High** — credential submission |
| `GET /api/v1/health` | None | Health check | **Low** — info disclosure |
| `GET /metrics` | **None** | Prometheus metrics | **Medium** — exposes internal metrics |
| `GET /api/v1/tasks` | JWT | List tasks | **Medium** — data exfiltration if token stolen |
| `POST /api/v1/tasks` | JWT | Create task | **Medium** — injection via title/description |
| `PATCH /api/v1/tasks/:id` | JWT | Update task | **Medium** — IDOR if ownership check fails |
| `DELETE /api/v1/tasks/:id` | JWT | Delete task | **Medium** — data destruction |
| `GET /api/v1/users/admin-query` | JWT+Admin | Admin endpoint | **High** — privilege escalation target |
| `POST /api/v1/orders` | JWT | Order creation | **Medium** — business logic abuse |

### 4.2 Infrastructure Surfaces

| Surface | Exposure | Risk |
|---------|----------|------|
| Docker API | Host-only | Misconfiguration → container escape |
| MySQL Port 3307 | Host-mapped | Direct DB access if firewall misconfigured |
| Grafana Port 3000 | Host-mapped | Default credentials, dashboard tampering |
| Prometheus Port 9090 | Host-mapped | Query internal metrics, alert manipulation |
| Alertmanager Port 9093 | Host-mapped | Alert suppression |
| SSH (VPS) | Internet | CD pipeline target |

### 4.3 Data Input Vectors

| Vector | Validation | Gap |
|--------|-----------|-----|
| Request Body (JSON) | `express-validator`, `filterObj()`, `securityDetector` | Pattern list is limited (6 regex patterns) |
| Query Parameters | `securityDetector` scans `req.query` | Sort field interpolated into SQL string |
| URL Parameters (`:id`) | None explicit | Integer parsing not enforced |
| Authorization Header | JWT verification | No token blacklist/revocation |
| Request Headers | Helmet defaults | `cors()` allows all origins |

---

## 5. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│ ZONE 0: UNTRUSTED (Internet)                                       │
│  ┌──────────┐     ┌──────────┐                                     │
│  │ Browser  │     │ Attacker │                                     │
│  └────┬─────┘     └────┬─────┘                                     │
│───────┼────────────────┼───────── TB1: TLS Termination ────────────│
│ ZONE 1: DMZ (Nginx Reverse Proxy)                                  │
│  ┌──────────────────┐                                              │
│  │ Nginx (TLS/HSTS) │                                              │
│  └────────┬─────────┘                                              │
│───────────┼───────────────────── TB2: Reverse Proxy Boundary ──────│
│ ZONE 2: APPLICATION (Docker Network)                               │
│  ┌────────────────────────────────────────────┐                    │
│  │ Express API Container                       │                   │
│  │  ┌──────────┐  ┌────────┐  ┌────────────┐  │                   │
│  │  │ Security │→ │ Auth   │→ │ Validation │  │                   │
│  │  │ Middleware│  │ (JWT)  │  │ Layer      │  │                   │
│  │  └──────────┘  └────────┘  └─────┬──────┘  │                   │
│  │──────────────────────────────────┼─── TB3: Auth Boundary ───── │
│  │  ┌──────────┐  ┌────────────┐   │          │                   │
│  │  │ Service  │← │ Controller │←──┘          │                   │
│  │  │ Layer    │  │ Layer      │               │                   │
│  │  └────┬─────┘  └────────────┘              │                   │
│  └───────┼────────────────────────────────────┘                    │
│──────────┼──────────────────────── TB4: Data Boundary ─────────────│
│ ZONE 3: DATA (Persistent Storage)                                  │
│  ┌──────────┐  ┌───────────┐                                      │
│  │ MySQL DB │  │ Log Files │                                      │
│  └──────────┘  └───────────┘                                      │
└─────────────────────────────────────────────────────────────────────┘
│──────────────────────────────────── TB5: CI/CD Boundary ───────────│
│ ZONE 4: BUILD/DEPLOY                                               │
│  ┌──────────────┐  ┌─────────────┐                                │
│  │ GitHub Actions│  │ VPS (SSH)   │                                │
│  └──────────────┘  └─────────────┘                                │
```

### Trust Boundary Analysis

| ID | Boundary | Crosses | Risk if Breached |
|----|----------|---------|------------------|
| TB1 | TLS Termination | Internet → Nginx | MITM, credential interception |
| TB2 | Reverse Proxy | Nginx → App container | Direct API exposure, header spoofing |
| TB3 | Auth Boundary | Unauthenticated → Authenticated zone | Full API access with forged/stolen tokens |
| TB4 | Data Boundary | App → Database | SQL injection, data exfiltration |
| TB5 | CI/CD Boundary | GitHub → Production VPS | Code injection, backdoor deployment |

---

## 6. STRIDE Analysis

### S — Spoofing

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| S1 | JWT token theft via XSS | A4 | Helmet XSS headers, `securityDetector` | Frontend stores token in JS variable (no HttpOnly cookie); `cors()` allows **all origins** | **High** |
| S2 | Brute-force login | A1 | `securityTrack` blocks IP after 5 attempts (15 min) | In-memory only — resets on restart; attackers can rotate IPs | **High** |
| S3 | JWT forgery | A2 | HMAC-SHA256 signing with `config.jwt.secret` | No key rotation mechanism; secret strength depends on env config | **Medium** |
| S4 | IP spoofing via proxy headers | TB2 | `req.ip` used for tracking | No `trust proxy` configuration — `req.ip` may be unreliable behind Nginx | **Medium** |

### T — Tampering

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| T1 | SQL injection via sort parameter | A5 | `allowFields` whitelist in `task.model.js` | `getTasksAdvanced()` uses string interpolation: `` `ORDER BY ${queryParams.sort}` `` — field is checked but value not parameterized | **High** |
| T2 | Request body manipulation | A5 | `filterObj()` whitelists `title`, `description` | Adequate for known fields | **Low** |
| T3 | JWT payload tampering | A4 | `jwt.verify()` validates signature | No `aud`/`iss` claims verified; role embedded in token, not re-fetched from DB | **Medium** |
| T4 | Log injection | A7 | Winston structured logging | User-controlled strings (email, title) logged without sanitization | **Low** |
| T5 | Cache poisoning | A5 | Cache key derived from `userId + queryParams` | No cache key length limit; attacker can fill memory with unique query combos | **Medium** |

### R — Repudiation

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| R1 | Deny malicious actions | A7 | Winston logs with `requestId`, `userId`, `ip` | Logs stored on local filesystem — could be deleted by compromised container; no immutable log sink | **Medium** |
| R2 | Deny account creation | A7 | Registration not logged | **No audit log for user registration** (`POST /api/v1/users`) | **Medium** |
| R3 | Admin action repudiation | A7 | Role logged in auth middleware | Admin-query endpoint has no business-level audit trail | **Low** |

### I — Information Disclosure

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| I1 | Metrics endpoint data leak | A10 | None | `/metrics` is **completely unauthenticated** — exposes request counts, response times, error rates | **High** |
| I2 | Error stack traces in responses | A8 | `error.middleware.js` | Need to verify production mode suppresses stacks | **Medium** |
| I3 | CI hardcoded secret | A2 | Environment variables | CI workflow has `JWT_SECRET: supersecretkey123` hardcoded in `ci.yml` | **Medium** |
| I4 | Database port exposed to host | A3 | Docker network isolation | Port `3307:3306` mapped — accessible from host network | **Medium** |
| I5 | Log files contain PII | A6, A7 | Log rotation via `winston-daily-rotate-file` | Logs contain IPs, emails, user IDs — no encryption at rest | **Medium** |
| I6 | Verbose login error timing | A1 | Generic "Invalid email or password" message | Timing difference between user-not-found vs wrong-password (DB query vs bcrypt compare) | **Low** |

### D — Denial of Service

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| D1 | API rate limit bypass | All | `express-rate-limit` (100 req/15 min) | `ALLOWED_IPS` env var can whitelist IPs; rate limit is per-IP (distributed attack bypasses) | **Medium** |
| D2 | Memory exhaustion via cache | A5 | In-memory `Cache` class with TTL | **No max cache size** — attacker can generate unique query params to fill heap | **High** |
| D3 | Connection pool exhaustion | A5 | MySQL pool via `mysql2` | Transaction-based operations acquire connections; no explicit pool size limit documented | **Medium** |
| D4 | Request body size bomb | All | `express.json({ limit: "10kb" })` | Adequate for JSON body | **Low** |
| D5 | Regex DoS (ReDoS) | All | `securityDetector` patterns | Current patterns are simple — low risk, but no complexity analysis done | **Low** |

### E — Elevation of Privilege

| ID | Threat | Target | Existing Control | Gap | Severity |
|----|--------|--------|-----------------|-----|----------|
| E1 | Role escalation via JWT manipulation | A4 | JWT signature verification | Role is baked into JWT at login — if user's role changes in DB, token retains old role until expiry | **Medium** |
| E2 | IDOR on task operations | A5 | `task.user_id !== userId` check in service layer | Consistent across get/update/delete — **adequate** | **Low** |
| E3 | Container privilege escalation | All | `no-new-privileges:true`, non-root user, read-only FS | Well-hardened — **adequate** | **Low** |
| E4 | Registration creates admin | A4 | Hardcoded `role = "member"` in `User.create()` | No role field accepted from request body — **adequate** | **Low** |
| E5 | CD pipeline compromise | A9 | SSH key in GitHub Secrets | `npm ci --production` runs without integrity check; `git pull` on VPS trusts `main` branch | **High** |

---

## 7. Risk Matrix

### Risk Scoring

- **Likelihood:** 1 (Rare) → 5 (Almost Certain)
- **Impact:** 1 (Negligible) → 5 (Critical)
- **Risk Score:** Likelihood × Impact

### Heat Map

```
Impact →    1-Negligible  2-Minor  3-Moderate  4-Major  5-Critical
Likelihood
5-Certain                                       D2
4-Likely                            S2,T1       I1       E5
3-Possible               R2        T3,T5,I4    S1       S3
2-Unlikely               D5,E4    I5,I6,R1    D1,D3
1-Rare                   T4        E1          I2,I3
```

### Ranked Risk Register

| Rank | ID | Threat | Likelihood | Impact | Score | Priority |
|------|----|--------|-----------|--------|-------|----------|
| 1 | S1 | JWT theft via XSS / open CORS | 3 | 4 | **12** | 🔴 Critical |
| 2 | E5 | CD pipeline compromise | 4 | 5 | **20** | 🔴 Critical |
| 3 | D2 | Cache memory exhaustion | 5 | 4 | **20** | 🔴 Critical |
| 4 | I1 | Unauthenticated metrics endpoint | 4 | 4 | **16** | 🔴 Critical |
| 5 | T1 | SQL string interpolation in sort | 4 | 3 | **12** | 🟠 High |
| 6 | S2 | Brute-force (in-memory tracker resets) | 4 | 3 | **12** | 🟠 High |
| 7 | T5 | Cache poisoning via query params | 3 | 3 | **9** | 🟡 Medium |
| 8 | S4 | IP spoofing (no trust proxy) | 3 | 3 | **9** | 🟡 Medium |
| 9 | T3 | JWT lacks aud/iss claims | 3 | 3 | **9** | 🟡 Medium |
| 10 | I4 | MySQL port exposed to host | 3 | 3 | **9** | 🟡 Medium |
| 11 | I3 | Hardcoded JWT secret in CI | 1 | 4 | **4** | 🟡 Medium |
| 12 | R2 | No registration audit log | 3 | 2 | **6** | 🟡 Medium |
| 13 | I5 | PII in log files | 2 | 3 | **6** | 🟢 Low |
| 14 | E1 | Stale role in JWT | 1 | 3 | **3** | 🟢 Low |
| 15 | D1 | Distributed rate-limit bypass | 2 | 4 | **8** | 🟡 Medium |

---

## 8. Recommendations Summary

### 🔴 Critical Priority

| ID | Recommendation | Mitigates |
|----|---------------|-----------|
| R-01 | Configure `cors()` with explicit allowed origins instead of wildcard | S1 |
| R-02 | Add `maxSize` limit to in-memory cache (e.g., 1000 entries) | D2 |
| R-03 | Add authentication middleware to `/metrics` endpoint | I1 |
| R-04 | Add `npm audit` and commit signature verification to CD pipeline | E5 |
| R-05 | Store JWT in HttpOnly cookie instead of exposing to JS on frontend | S1 |

### 🟠 High Priority

| ID | Recommendation | Mitigates |
|----|---------------|-----------|
| R-06 | Parameterize sort field in `getTasksAdvanced()` using a safe mapping object instead of string interpolation | T1 |
| R-07 | Move brute-force tracking to Redis for persistence across restarts | S2 |
| R-08 | Configure `app.set('trust proxy', 1)` for correct IP detection behind Nginx | S4 |
| R-09 | Remove hardcoded `JWT_SECRET` from `ci.yml`; use GitHub Secrets | I3 |

### 🟡 Medium Priority

| ID | Recommendation | Mitigates |
|----|---------------|-----------|
| R-10 | Add `iss` and `aud` claims to JWT generation and verification | T3 |
| R-11 | Remove MySQL host port mapping in production `docker-compose.yml` | I4 |
| R-12 | Add audit logging for user registration events | R2 |
| R-13 | Implement JWT token blacklist or short-lived tokens with refresh tokens | E1, S1 |
| R-14 | Add rate limiting per user (not just per IP) for authenticated endpoints | D1 |

### 🟢 Low Priority

| ID | Recommendation | Mitigates |
|----|---------------|-----------|
| R-15 | Sanitize user-controlled strings before logging (email, titles) | T4 |
| R-16 | Encrypt log files at rest or ship to immutable external log sink | I5, R1 |
| R-17 | Add constant-time comparison for login (mitigate timing oracle) | I6 |

---

## Appendix A: Security Controls Already in Place

| Control | Status | Component |
|---------|--------|-----------|
| Helmet security headers | ✅ Active | `app.js` |
| HPP protection | ✅ Active | `app.js` |
| Rate limiting (100 req/15 min) | ✅ Active | `app.js` |
| JWT authentication | ✅ Active | `auth.middleware.js` |
| RBAC (admin/member) | ✅ Active | `auth.middleware.js` |
| bcrypt password hashing | ✅ Active | `auth.controller.js` |
| Input validation (express-validator) | ✅ Active | `validation.middleware.js` |
| SQL injection detection (regex) | ✅ Active | `securityDetector.js` |
| Brute-force IP blocking | ✅ Active | `securityTrack.js` |
| Request body size limit (10kb) | ✅ Active | `app.js` |
| Input field whitelisting (`filterObj`) | ✅ Active | `task.controller.js` |
| Parameterized SQL queries | ✅ Active | `user.model.js`, `task.model.js` (partial) |
| Non-root Docker container | ✅ Active | `Dockerfile` |
| Read-only root filesystem | ✅ Active | `docker-compose.yml` |
| No-new-privileges flag | ✅ Active | `docker-compose.yml` |
| Resource limits (512MB / 0.5 CPU) | ✅ Active | `docker-compose.yml` |
| Multi-stage Docker build | ✅ Active | `Dockerfile` |
| Trivy container scanning | ✅ Active | `ci.yml` |
| `npm audit` in CI | ✅ Active | `ci.yml` |
| Structured JSON logging | ✅ Active | Winston logger |
| Request ID tracing | ✅ Active | `requestId.middleware.js` |
| Graceful shutdown handlers | ✅ Active | `server.js` |
| TLS/HSTS via Nginx | ✅ Configured | `nginx.conf` |

---

*This threat model should be reviewed and updated whenever significant architectural changes are made to the TaskFlow API.*
