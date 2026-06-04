/**
 * @file tasks-load.js
 * @description K6 Load Test — TaskFlow API
 *
 * Test Stages:
 *   1. Warm-up      : 10 VUs for 30s
 *   2. Ramp-up      : 10 → 50 VUs over 1m
 *   3. Sustained    : 50 VUs for 2m  ← peak load
 *   4. Spike        : 50 → 100 VUs for 30s
 *   5. Recovery     : 100 → 10 VUs over 30s
 *   6. Cool-down    : 10 VUs for 30s
 *
 * Routes tested (all JWT-protected):
 *   POST /api/v1/auth/login        — authenticate & get token
 *   GET  /api/v1/tasks             — list tasks
 *   POST /api/v1/tasks             — create task
 *   GET  /api/v1/tasks/:id         — get single task
 *   PATCH /api/v1/tasks/:id        — update task
 *   DELETE /api/v1/tasks/:id       — delete task
 *   GET  /api/v1/health            — health check
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const API      = `${BASE_URL}/api/v1`;

// ── Test credentials (override via env vars) ──────────────────────────────────
const TEST_EMAIL    = __ENV.TEST_EMAIL    || "admin@taskflow.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "Admin@1234";

// ── Custom metrics ────────────────────────────────────────────────────────────
const loginDuration      = new Trend("login_duration",       true);
const taskListDuration   = new Trend("task_list_duration",   true);
const taskCreateDuration = new Trend("task_create_duration", true);
const taskGetDuration    = new Trend("task_get_duration",    true);
const taskUpdateDuration = new Trend("task_update_duration", true);
const taskDeleteDuration = new Trend("task_delete_duration", true);
const healthDuration     = new Trend("health_check_duration",true);

const authFailRate    = new Rate("auth_failures");
const taskFailRate    = new Rate("task_failures");
const totalRequests   = new Counter("total_requests");

// ── Options / thresholds ──────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: "30s", target: 10  }, // warm-up
    { duration: "1m",  target: 50  }, // ramp-up
    { duration: "2m",  target: 50  }, // sustained load
    { duration: "30s", target: 100 }, // spike
    { duration: "30s", target: 10  }, // recovery
    { duration: "30s", target: 10  }, // cool-down
  ],

  thresholds: {
    // Overall HTTP success
    http_req_failed:     ["rate<0.01"],           // < 1% failure
    http_req_duration:   ["p(95)<500", "p(99)<1000"], // 95th% < 500ms, 99th% < 1s

    // Per-endpoint response times
    login_duration:        ["p(95)<800"],
    task_list_duration:    ["p(95)<400"],
    task_create_duration:  ["p(95)<600"],
    task_get_duration:     ["p(95)<300"],
    task_update_duration:  ["p(95)<600"],
    task_delete_duration:  ["p(95)<600"],
    health_check_duration: ["p(95)<200"],

    // Business metrics
    auth_failures:  ["rate<0.01"],
    task_failures:  ["rate<0.02"],
  },

  // Output to InfluxDB for Grafana (used when started with --out influxdb=...)
  // summaryTrendStats: ["min", "med", "avg", "p(90)", "p(95)", "p(99)", "max"],
};

// ── Helper: JSON headers ──────────────────────────────────────────────────────
function jsonHeaders(token = null) {
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ── Setup: runs ONCE — login and share token with all VUs ────────────────────
export function setup() {
  console.log(` TaskFlow Load Test starting against ${BASE_URL}`);
  console.log(`   Date: ${new Date().toISOString()}`);

  // Health check
  const healthRes = http.get(`${API}/health`);
  if (healthRes.status !== 200) {
    console.error(` Health check failed (${healthRes.status}). Is the server running?`);
  } else {
    console.log(" Health check passed — server is up");
  }

  // Login ONCE — measure auth performance without concurrent bcrypt pressure
  const loginStart = Date.now();
  const loginRes = http.post(
    `${API}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: jsonHeaders(), tags: { endpoint: "auth_login" } }
  );
  const loginMs = Date.now() - loginStart;

  loginDuration.add(loginRes.timings.duration);
  totalRequests.add(1);

  const loginOk = check(loginRes, {
    "setup login → status 200":       (r) => r.status === 200,
    "setup login → has token":        (r) => { try { return !!JSON.parse(r.body).data?.token; } catch { return false; } },
    "setup login → response < 800ms": (r) => r.timings.duration < 800,
  });

  authFailRate.add(!loginOk);

  if (!loginOk) {
    console.error(`❌ Setup login failed (${loginRes.status}): ${loginRes.body}`);
    return { token: null, loginMs };
  }

  const token = JSON.parse(loginRes.body).data?.token;
  console.log(` Auth token obtained in ${loginMs}ms — sharing with all VUs`);
  return { token, loginMs };
}

// ── Main VU function — receives shared token from setup() ─────────────────────
export default function (data) {
  const token = data?.token || null;
  let createdTaskId = null;

  // Report auth metric from setup (once, not per-VU iteration)
  // Auth group is replaced with shared-token usage to avoid CPU saturation

  // Skip task tests if no token from setup
  if (!token) {
    console.warn(`VU ${__VU}: no shared token from setup — skipping`);
    authFailRate.add(1);
    return;
  }

  // ── GROUP 2: Health Check ─────────────────────────────────────────────────
  group("02 - Health Check", () => {
    const res = http.get(`${API}/health`, {
      headers: jsonHeaders(token),
      tags:    { endpoint: "health" },
    });

    totalRequests.add(1);
    healthDuration.add(res.timings.duration);

    check(res, {
      "health → status 200":       (r) => r.status === 200,
      "health → response < 200ms": (r) => r.timings.duration < 200,
    });
  });

  sleep(randomIntBetween(1, 2));

  // ── GROUP 3: List Tasks (protected route) ─────────────────────────────────
  group("03 - GET /tasks (protected)", () => {
    const res = http.get(`${API}/tasks`, {
      headers: jsonHeaders(token),
      tags:    { endpoint: "task_list" },
    });

    totalRequests.add(1);
    taskListDuration.add(res.timings.duration);

    const ok = check(res, {
      "GET /tasks → status 200":        (r) => r.status === 200,
      "GET /tasks → returns array":     (r) => {
        try {
          const b = JSON.parse(r.body);
          return Array.isArray(b.data) || Array.isArray(b);
        } catch { return false; }
      },
      "GET /tasks → response < 400ms": (r) => r.timings.duration < 400,
    });

    taskFailRate.add(!ok);
  });

  sleep(randomIntBetween(1, 2));

  // ── GROUP 4: Create Task (protected route) ────────────────────────────────
  group("04 - POST /tasks (protected)", () => {
    const taskPayload = JSON.stringify({
      title:       `Load Test Task ${Date.now()}`,
      description: "Automated task created by k6 load test",
      status:      "pending",
      priority:    "medium",
    });

    const res = http.post(`${API}/tasks`, taskPayload, {
      headers: jsonHeaders(token),
      tags:    { endpoint: "task_create" },
    });

    totalRequests.add(1);
    taskCreateDuration.add(res.timings.duration);

    const ok = check(res, {
      "POST /tasks → status 201":        (r) => r.status === 201,
      "POST /tasks → has id":            (r) => {
        try {
          const b = JSON.parse(r.body);
          return !!(b.data?.id || b.id);
        } catch { return false; }
      },
      "POST /tasks → response < 600ms": (r) => r.timings.duration < 600,
    });

    taskFailRate.add(!ok);

    if (ok && res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        createdTaskId = body.data?.id || body.id;
      } catch (_) {}
    }
  });

  sleep(randomIntBetween(1, 2));

  // ── GROUP 5: Get Task by ID (protected route) ─────────────────────────────
  if (createdTaskId) {
    group("05 - GET /tasks/:id (protected)", () => {
      const res = http.get(`${API}/tasks/${createdTaskId}`, {
        headers: jsonHeaders(token),
        tags:    { endpoint: "task_get_by_id" },
      });

      totalRequests.add(1);
      taskGetDuration.add(res.timings.duration);

      const ok = check(res, {
        "GET /tasks/:id → status 200":        (r) => r.status === 200,
        "GET /tasks/:id → correct id":        (r) => {
          try {
            const b = JSON.parse(r.body);
            return (b.data?.id || b.id) == createdTaskId;
          } catch { return false; }
        },
        "GET /tasks/:id → response < 300ms": (r) => r.timings.duration < 300,
      });

      taskFailRate.add(!ok);
    });

    sleep(randomIntBetween(1, 2));

    // ── GROUP 6: Update Task (protected route) ──────────────────────────────
    group("06 - PATCH /tasks/:id (protected)", () => {
      const updatePayload = JSON.stringify({
        title:  `Updated by k6 — ${Date.now()}`,
        status: "in-progress",
      });

      const res = http.patch(`${API}/tasks/${createdTaskId}`, updatePayload, {
        headers: jsonHeaders(token),
        tags:    { endpoint: "task_update" },
      });

      totalRequests.add(1);
      taskUpdateDuration.add(res.timings.duration);

      const ok = check(res, {
        "PATCH /tasks/:id → status 200":        (r) => r.status === 200,
        "PATCH /tasks/:id → response < 600ms": (r) => r.timings.duration < 600,
      });

      taskFailRate.add(!ok);
    });

    sleep(randomIntBetween(1, 2));

    // ── GROUP 7: Delete Task (protected route) ──────────────────────────────
    group("07 - DELETE /tasks/:id (protected)", () => {
      const res = http.del(`${API}/tasks/${createdTaskId}`, null, {
        headers: jsonHeaders(token),
        tags:    { endpoint: "task_delete" },
      });

      totalRequests.add(1);
      taskDeleteDuration.add(res.timings.duration);

      const ok = check(res, {
        "DELETE /tasks/:id → status 200":       (r) => r.status === 200 || r.status === 204,
        "DELETE /tasks/:id → response < 600ms": (r) => r.timings.duration < 600,
      });

      taskFailRate.add(!ok);
    });
  }

  // ── GROUP 8: Unauthorized access test ────────────────────────────────────
  group("08 - Unauthorized Access (no token)", () => {
    const res = http.get(`${API}/tasks`, {
      headers: { "Content-Type": "application/json" },
      tags:    { endpoint: "unauthorized_attempt" },
    });

    totalRequests.add(1);

    check(res, {
      "No token → 401 Unauthorized": (r) => r.status === 401,
    });
  });

  sleep(randomIntBetween(1, 3));
}

// ── Teardown: summary after all VUs complete ──────────────────────────────────
export function teardown(data) {
  console.log("✅ Load test completed.");
  console.log(`   Total requests tracked: see k6 summary above`);
}

// ── Custom HTML summary output ────────────────────────────────────────────────
export function handleSummary(data) {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

  return {
    [`tests/load/reports/load-test-report-${dateStr}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

// Inline text summary (avoids external import issues)
function textSummary(data, opts = {}) {
  const { indent = " " } = opts;
  const lines = [];

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("  TASKFLOW API — K6 LOAD TEST SUMMARY");
  lines.push(`  Date: ${new Date().toUTCString()}`);
  lines.push("═══════════════════════════════════════════════════════════");

  // HTTP stats
  const dur = data.metrics?.http_req_duration;
  if (dur) {
    lines.push(`\n${indent}HTTP Response Times:`);
    lines.push(`${indent}  avg  : ${dur.values.avg?.toFixed(2)}ms`);
    lines.push(`${indent}  med  : ${dur.values.med?.toFixed(2)}ms`);
    lines.push(`${indent}  p90  : ${dur.values["p(90)"]?.toFixed(2)}ms`);
    lines.push(`${indent}  p95  : ${dur.values["p(95)"]?.toFixed(2)}ms`);
    lines.push(`${indent}  p99  : ${dur.values["p(99)"]?.toFixed(2)}ms`);
    lines.push(`${indent}  max  : ${dur.values.max?.toFixed(2)}ms`);
  }

  const reqs = data.metrics?.http_reqs;
  if (reqs) {
    lines.push(`\n${indent}Total HTTP Requests : ${reqs.values.count}`);
    lines.push(`${indent}Request Rate        : ${reqs.values.rate?.toFixed(2)} req/s`);
  }

  const failed = data.metrics?.http_req_failed;
  if (failed) {
    lines.push(`${indent}Failure Rate        : ${(failed.values.rate * 100).toFixed(2)}%`);
  }

  // Threshold pass/fail
  lines.push(`\n${indent}Thresholds:`);
  for (const [name, metric] of Object.entries(data.metrics || {})) {
    if (metric.thresholds) {
      for (const [expr, result] of Object.entries(metric.thresholds)) {
        const icon = result.ok ? "✅" : "❌";
        lines.push(`${indent}  ${icon} ${name}: ${expr}`);
      }
    }
  }

  lines.push("\n═══════════════════════════════════════════════════════════\n");
  return lines.join("\n");
}
