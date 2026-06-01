import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Type Definitions ──────────────────────────────────────────────────────────

interface EnvConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Database
  MONGODB_URI: string;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // CORS
  CLIENT_URL: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'debug';

  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;

  // AWS
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;

  // Email
  EMAIL_SMTP_HOST: string;
  EMAIL_SMTP_PORT: number;
  EMAIL_SMTP_USER: string;
  EMAIL_SMTP_PASS: string;
  EMAIL_FROM_NAME: string;
  EMAIL_FROM_ADDRESS: string;

  // Redis
  REDIS_URL: string;
}

// ─── Required Variables for Bootstrap ────────────────────────────────────────
// These must be present or the server refuses to start.
const REQUIRED_VARS: (keyof EnvConfig)[] = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`[Config] Environment variable ${key} must be a number, got: "${raw}"`);
  }
  return parsed;
}

// ─── Validate Required Vars ───────────────────────────────────────────────────

function validateRequiredVars(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config] The following required environment variables are not set:\n  → ${missing.join('\n  → ')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}

// ─── Build Config ─────────────────────────────────────────────────────────────

function buildConfig(): EnvConfig {
  validateRequiredVars();

  const nodeEnv = (process.env['NODE_ENV'] ?? 'development') as EnvConfig['NODE_ENV'];
  const validNodeEnvs: EnvConfig['NODE_ENV'][] = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(nodeEnv)) {
    throw new Error(`[Config] NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
  }

  const logLevel = (process.env['LOG_LEVEL'] ?? 'info') as EnvConfig['LOG_LEVEL'];
  const validLogLevels: EnvConfig['LOG_LEVEL'][] = ['error', 'warn', 'info', 'http', 'debug'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`[Config] LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: getEnvInt('PORT', 5000),

    MONGODB_URI: getEnvVar('MONGODB_URI'),

    JWT_SECRET: getEnvVar('JWT_SECRET'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRES_IN: getEnvVar('JWT_ACCESS_EXPIRES_IN', '15m'),
    JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),

    CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:3000'),

    LOG_LEVEL: logLevel,

    RAZORPAY_KEY_ID: getEnvVar('RAZORPAY_KEY_ID', ''),
    RAZORPAY_KEY_SECRET: getEnvVar('RAZORPAY_KEY_SECRET', ''),
    RAZORPAY_WEBHOOK_SECRET: getEnvVar('RAZORPAY_WEBHOOK_SECRET', ''),

    AWS_ACCESS_KEY_ID: getEnvVar('AWS_ACCESS_KEY_ID', ''),
    AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY', ''),
    AWS_REGION: getEnvVar('AWS_REGION', 'ap-south-1'),
    AWS_S3_BUCKET: getEnvVar('AWS_S3_BUCKET', ''),

    EMAIL_SMTP_HOST: getEnvVar('EMAIL_SMTP_HOST', ''),
    EMAIL_SMTP_PORT: getEnvInt('EMAIL_SMTP_PORT', 587),
    EMAIL_SMTP_USER: getEnvVar('EMAIL_SMTP_USER', ''),
    EMAIL_SMTP_PASS: getEnvVar('EMAIL_SMTP_PASS', ''),
    EMAIL_FROM_NAME: getEnvVar('EMAIL_FROM_NAME', 'KlawTax'),
    EMAIL_FROM_ADDRESS: getEnvVar('EMAIL_FROM_ADDRESS', 'noreply@klawtax.online'),

    REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  };
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
// Lazy-loaded on first import, cached thereafter.

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    _config = buildConfig();
  }
  return _config;
}

export const config = {
  get(): EnvConfig {
    return getConfig();
  },
  get isProduction(): boolean {
    return getConfig().NODE_ENV === 'production';
  },
  get isDevelopment(): boolean {
    return getConfig().NODE_ENV === 'development';
  },
  get isTest(): boolean {
    return getConfig().NODE_ENV === 'test';
  },
};

export type { EnvConfig };
