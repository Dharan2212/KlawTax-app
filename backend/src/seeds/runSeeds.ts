/**
 * KlawTax Seed Runner — Batch 2
 *
 * Usage (from backend root):
 *   npx tsx src/seeds/runSeeds.ts
 *
 * Runs all seed functions in order:
 *   1. Services catalog (26 records)
 *   2. Admin user (from env vars)
 *   3. System settings (11 canonical entries)
 *   4. Scheduled jobs registry (10 canonical entries)
 *
 * All seeds are idempotent — safe to run multiple times.
 */

import mongoose from 'mongoose';
import { getConfig } from '../config/env';
import { logger } from '../utils/logger';
import { Service } from '../models/service';
import { SERVICE_SEED_DATA } from './services.seed';
import { runAdminUserSeed } from './adminUser.seed';
import { runSystemSettingsSeed } from './systemSettings.seed';
import { runScheduledJobsSeed } from './scheduledJobs.seed';

async function runServiceSeed(): Promise<void> {
  let updated = 0;
  let errors  = 0;

  for (const data of SERVICE_SEED_DATA) {
    try {
      await Service.findOneAndUpdate(
        { slug: data.slug },
        { $set: data },
        { upsert: true, new: true, runValidators: true }
      );
      updated++;
    } catch (err) {
      errors++;
      logger.error('[seed:services] Failed to upsert service', { slug: data.slug, err });
    }
  }

  logger.info('[seed:services] Services seed complete', {
    total: SERVICE_SEED_DATA.length,
    updated,
    errors,
  });
}

async function runAllSeeds(): Promise<void> {
  const cfg = getConfig();

  logger.info('[seed] Connecting to MongoDB…');
  await mongoose.connect(cfg.MONGODB_URI);
  logger.info('[seed] Connected.');

  logger.info('[seed] ── Step 1/4: Services catalog ──');
  await runServiceSeed();

  logger.info('[seed] ── Step 2/4: Admin user ──');
  await runAdminUserSeed();

  logger.info('[seed] ── Step 3/4: System settings ──');
  await runSystemSettingsSeed();

  logger.info('[seed] ── Step 4/4: Scheduled jobs registry ──');
  await runScheduledJobsSeed();

  logger.info('[seed] All seeds complete ✓');
  await mongoose.disconnect();
  logger.info('[seed] Disconnected.');
}

runAllSeeds().catch((err) => {
  logger.error('[seed] Fatal error during seed run', { err });
  process.exit(1);
});
