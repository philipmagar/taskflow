/**
 * @file auth-load.js
 * @description K6 Load Test — Auth Endpoint Only
 * Tests login under high concurrency to detect auth bottlenecks
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const API      = `${BASE_URL}/api/v1`;

const loginDuration  = new Trend("auth_login_duration", true);
const loginFailRate  = new Rate("auth_login_fail_rate");

export const options = {
  stages: [
    { duration: "30s", target: 20  },
    { duration: "1m",  target: 50  },
    { duration: "1m",  target: 50  },
    { duration: "30s", target: 0   },
  ],
  thresholds: {
    auth_login_duration:  ["p(95)<1000"],
    auth_login_fail_rate: ["rate<0.05"],
    http_req_failed:      ["rate<0.05"],
  },
};

export default function () {
  const res = http.post(
    `${API}/auth/login`,
    JSON.stringify({
      email:    __ENV.TEST_EMAIL    || "admin@taskflow.com",
      password: __ENV.TEST_PASSWORD || "Admin@1234",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    "login → 200":      (r) => r.status === 200,
    "login → token":    (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
    "login → < 1000ms":(r) => r.timings.duration < 1000,
  });

  loginFailRate.add(!ok);
  sleep(randomIntBetween(1, 3));
}

export function handleSummary(data) {
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return {
    [`tests/load/reports/auth-load-report-${dateStr}.json`]: JSON.stringify(data, null, 2),
  };
}
