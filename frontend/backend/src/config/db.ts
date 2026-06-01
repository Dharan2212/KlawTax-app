import mongoose from 'mongoose';
import { getConfig } from './env';
import { logger } from '../utils/logger';

// ─── Connection Options ───────────────────────────────────────────────────────

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  // Keep the connection alive
  serverSelectionTimeoutMS: 10_000,   // 10s — fail fast on connection issues
  socketTimeoutMS: 45_000,            // 45s — drop slow operations
  maxPoolSize: 10,                    // Max concurrent connections in pool
  minPoolSize: 2,                     // Keep minimum connections warm
  connectTimeoutMS: 10_000,           // Initial connection timeout
  heartbeatFrequencyMS: 30_000,       // Check connection health every 30s
};

// ─── Connection State Tracking ────────────────────────────────────────────────

let isConnected = false;

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// ─── Event Hooks ──────────────────────────────────────────────────────────────

function registerConnectionEvents(): void {
  const conn = mongoose.connection;

  conn.on('connected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB connected successfully', {
      host: conn.host,
      name: conn.name,
    });
  });

  conn.on('disconnected', () => {
    isConnected = false;
    logger.warn('[DB] MongoDB disconnected');
  });

  conn.on('reconnected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB reconnected');
  });

  conn.on('error', (err: Error) => {
    isConnected = false;
    logger.error('[DB] MongoDB connection error', { error: err.message });
  });

  conn.on('close', () => {
    isConnected = false;
    logger.info('[DB] MongoDB connection closed');
  });
}

// ─── Connect ──────────────────────────────────────────────────────────────────

export async function connectDatabase(): Promise<void> {
  if (isDbConnected()) {
    logger.debug('[DB] Already connected — skipping reconnect');
    return;
  }

  registerConnectionEvents();

  const { MONGODB_URI } = getConfig();

  logger.info('[DB] Connecting to MongoDB...');

  try {
    await mongoose.connect(MONGODB_URI, MONGOOSE_OPTIONS);
    // The 'connected' event above will set isConnected = true and log success
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[DB] Failed to connect to MongoDB', { error: message });
    throw err; // Let server.ts handle the shutdown
  }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

export async function disconnectDatabase(): Promise<void> {
  if (!isDbConnected()) {
    return;
  }

  try {
    await mongoose.connection.close(false); // false = don't force close
    logger.info('[DB] MongoDB connection closed gracefully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[DB] Error while closing MongoDB connection', { error: message });
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export function getDatabaseHealthStatus(): 'ok' | 'error' {
  const state = mongoose.connection.readyState;
  // 1 = connected
  return state === 1 ? 'ok' : 'error';
}
