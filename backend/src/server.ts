/**
 * KlawTax Backend — Server Bootstrap
 *
 * Responsibilities:
 *  1. Load and validate environment configuration
 *  2. Connect to MongoDB
 *  3. Start Express server
 *  4. Handle graceful shutdown (SIGTERM / SIGINT)
 *  5. Handle uncaught exceptions and unhandled rejections
 */

// Load env first — before any other imports that may depend on process.env
import { getConfig } from './config/env';

// Early validation — abort immediately if critical env vars are missing
let cfg: ReturnType<typeof getConfig>;
try {
  cfg = getConfig();
} catch (err) {
  // Cannot use Winston logger here because it may depend on LOG_LEVEL from env
  console.error('[Bootstrap] Environment validation failed:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { logger } from './utils/logger';
import { initAuthMiddleware } from './modules/auth';
import { seedScheduledJobs, startScheduler, stopScheduler } from './jobs/scheduler';

// ─── Uncaught Exception / Rejection Guards ────────────────────────────────────
// Register these FIRST so any error during startup is captured

process.on('uncaughtException', (err: Error) => {
  logger.error('[Bootstrap] Uncaught exception — process will exit', {
    message: err.message,
    stack: err.stack,
  });
  // Give logger a moment to flush, then exit with failure code
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error('[Bootstrap] Unhandled promise rejection', { message, stack });
  // Do not exit — log and continue (prevents crashes from transient async errors)
  // If this becomes a recurring pattern, investigate and fix the root cause.
});

// ─── Server State ─────────────────────────────────────────────────────────────

let server: http.Server | null = null;
let isShuttingDown = false;

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`[Bootstrap] Received ${signal} but shutdown already in progress`);
    return;
  }

  isShuttingDown = true;
  logger.info(`[Bootstrap] Received ${signal} — initiating graceful shutdown...`);

  // 1. Stop accepting new HTTP connections
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close((err) => {
        if (err) {
          logger.error('[Bootstrap] Error closing HTTP server', { error: err.message });
        } else {
          logger.info('[Bootstrap] HTTP server closed — no longer accepting requests');
        }
        resolve();
      });
    });
  }

  // 2. Stop background scheduler
  stopScheduler();

  // 3. Close database connection
  await disconnectDatabase();

  logger.info('[Bootstrap] Graceful shutdown complete');
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  logger.info('[Bootstrap] Starting KlawTax API Server...', {
    env: cfg.NODE_ENV,
    pid: process.pid,
    nodeVersion: process.version,
  });

  // 1. Connect to MongoDB
  try {
    await connectDatabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[Bootstrap] Database connection failed — cannot start server', {
      error: message,
    });
    process.exit(1);
  }

  // 2. Initialise auth middleware (JWT verifier)
  initAuthMiddleware();
  logger.info('[Bootstrap] Auth middleware initialised');

  // 3. Seed scheduled job registry and start scheduler
  try {
    await seedScheduledJobs();
    startScheduler();
    logger.info('[Bootstrap] Background scheduler started');
  } catch (err) {
    logger.warn('[Bootstrap] Scheduler startup failed — server continues without background jobs', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 4. Create Express app
  const app = createApp();

  // 4. Start HTTP server
  server = http.createServer(app);

  server.listen(cfg.PORT, () => {
    logger.info(`[Bootstrap] ✅ Server is running`, {
      port: cfg.PORT,
      env: cfg.NODE_ENV,
      health: `http://localhost:${cfg.PORT}/api/v1/health`,
    });
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`[Bootstrap] Port ${cfg.PORT} is already in use`, { port: cfg.PORT });
    } else {
      logger.error('[Bootstrap] HTTP server error', { error: err.message, code: err.code });
    }
    process.exit(1);
  });
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

start();
