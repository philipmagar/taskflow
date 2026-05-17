module.exports = {
  apps: [
    {
      name: 'taskflow-api',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      merge_logs: true
    }
  ]
};
