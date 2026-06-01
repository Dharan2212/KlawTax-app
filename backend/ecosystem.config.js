// ══════════════════════════════════════════════════════════════════════════════
// KlawTax Backend — PM2 Ecosystem Configuration
// Version 1.5 | Phase 7.2 Release Hardening
//
// Usage:
//   pm2 start ecosystem.config.js --env production   # start in production
//   pm2 start ecosystem.config.js                    # start in development
//   pm2 save                                         # persist process list
//   pm2 startup                                      # enable auto-start on boot
//   pm2 logs klawtax-api                             # tail logs
//   pm2 monit                                        # real-time monitoring
// ══════════════════════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      // ── Identity ────────────────────────────────────────────────────────────
      name: 'klawtax-api',
      script: 'dist/server.js',
      cwd: '/var/www/klawtax/backend',

      // ── Instances ───────────────────────────────────────────────────────────
      // Single instance is REQUIRED for the scheduler (node-cron jobs).
      // Multiple instances would cause duplicate scheduled job execution.
      // If you need horizontal scaling, move the scheduler to a separate process.
      instances: 1,
      exec_mode: 'fork',

      // ── Restart Policy ──────────────────────────────────────────────────────
      autorestart: true,
      watch: false,             // Never watch in production
      max_restarts: 10,         // Crash loop protection
      restart_delay: 4000,      // 4s between restarts (ms)
      min_uptime: '10s',        // Must run 10s to count as successful start
      exp_backoff_restart_delay: 100, // Exponential backoff on crashes

      // ── Memory Limit ────────────────────────────────────────────────────────
      // Restart if memory exceeds 512MB (conservative for a 1GB VPS)
      max_memory_restart: '512M',

      // ── Graceful Shutdown ───────────────────────────────────────────────────
      kill_timeout: 5000,       // Wait 5s for graceful shutdown before SIGKILL
      listen_timeout: 10000,    // Wait 10s for app to become ready

      // ── Logs ────────────────────────────────────────────────────────────────
      out_file: '/var/log/klawtax/api-out.log',
      error_file: '/var/log/klawtax/api-error.log',
      merge_logs: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── Node.js Flags ───────────────────────────────────────────────────────
      node_args: '--max-old-space-size=460',

      // ── Environment: Development ────────────────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },

      // ── Environment: Production ─────────────────────────────────────────────
      // PM2 reads .env file automatically when env_file is set,
      // OR load-env from /var/www/klawtax/backend/.env
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
