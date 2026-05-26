const client = require("prom-client");

const register = new client.Registry();

register.setDefaultLabels({
  app: "taskflow-api",
});

client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

register.registerMetric(httpRequestDurationMicroseconds);

const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
      method: req.method,
    });
  });
  next();
};

const metricsEndpoint = async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
};
