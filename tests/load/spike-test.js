/**
 * @file spike-test.js
 * @description K6 Spike Test — Sudden traffic surge simulation
 * Tests API resilience under sudden load spikes
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const API      = `${BASE_URL}/api/v1`;

const spikeFailRate = new Rate("spike_fail_rate");

export const options = {
  stages: [
    { duration: "10s", target: 10  }, // baseline
    { duration: "10s", target: 200 }, // instant spike
    { duration: "1m",  target: 200 }, // hold spike
    { duration: "10s", target: 10  }, // recover
    { duration: "30s", target: 10  }, // steady state
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],  // Allow up to 10% failures during spike
    http_req_duration: ["p(95)<2000"],
    spike_fail_rate: ["rate<0.10"],
  },
};

export default function () {
  // Health check under spike (no auth needed)
  const healthRes = http.get(`${API}/health`, {
    tags: { endpoint: "health_spike" },
  });

  const ok = check(healthRes, {
    "health → not down during spike": (r) => r.status < 500,
  });
  spikeFailRate.add(!ok);

  sleep(1);
}

export function handleSummary(data) {
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return {
    [`tests/load/reports/spike-test-report-${dateStr}.json`]: JSON.stringify(data, null, 2),
  };
}
