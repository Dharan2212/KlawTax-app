/**
 * Admin User Seed
 *
 * Creates the first admin account from environment variables.
 * Safe to re-run — skips if admin with same email already exists.
 *
 * Required env vars:
 *   ADMIN_EMAIL    (default: admin@klawtax.online)
 *   ADMIN_PASSWORD (default: KlawTax@Admin2025!)
 */

import bcrypt from 'bcryptjs';
import { User, AccountStatus } from '../models/user';
import { Role } from '../utils/permissions';
import { logger } from '../utils/logger';

const DEFAULT_ADMIN_EMAIL    = 'admin@klawtax.online';
const DEFAULT_ADMIN_PASSWORD = 'KlawTax@Admin2025!';

export async function runAdminUserSeed(): Promise<void> {
  const email    = (process.env.ADMIN_EMAIL    || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const password =  process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info('[seed:admin] Admin account already exists — skipping', { email });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    firstName:       'KlawTax',
    lastName:        'Admin',
    email,
    passwordHash,
    role:            Role.Admin,
    accountStatus:   AccountStatus.Active,
    isEmailVerified: true,
    phone:           '+910000000000',
  });

  logger.info('[seed:admin] Admin user created', { email });
  logger.warn('[seed:admin] ⚠️  Change the default admin password after first login!');
}
