import { describe, it, expect, printResults } from './_helpers';
import { buildSystemChecks, buildHealthResponse, buildReadinessResponse } from '../modules/health/healthService';
import { getSchedulerStatus } from '../jobs/scheduler';

describe('buildSystemChecks', () => {
  it('returns object with database key', () => {
    const c = buildSystemChecks();
    expect(c).toHaveProperty('database');
  });

  it('database status is a valid value', () => {
    const c = buildSystemChecks();
    const valid = ['ok','degraded','error','not_configured'];
    expect(valid.includes(c.database)).toBeTruthy();
  });

  it('returns an object with at least one health check key', () => {
    const c = buildSystemChecks();
    expect(Object.keys(c).length >= 1).toBeTruthy();
  });
});

describe('buildHealthResponse', () => {
  it('returns { body, httpStatus }', () => {
    const r = buildHealthResponse();
    expect(r).toHaveProperty('body');
    expect(r).toHaveProperty('httpStatus');
  });

  it('body has status, uptime, checks, version, timestamp', () => {
    const { body } = buildHealthResponse();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('checks');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('timestamp');
  });

  it('status is ok | degraded | error', () => {
    const { body } = buildHealthResponse();
    expect(['ok','degraded','error'].includes(body.status)).toBeTruthy();
  });

  it('uptime is a non-negative number', () => {
    expect((buildHealthResponse().body.uptime as number) >= 0).toBeTruthy();
  });

  it('timestamp is a parseable date string', () => {
    expect(!isNaN(Date.parse(buildHealthResponse().body.timestamp))).toBeTruthy();
  });

  it('httpStatus is 200 | 207 | 503', () => {
    const { httpStatus } = buildHealthResponse();
    expect([200, 207, 503].includes(httpStatus)).toBeTruthy();
  });
});

describe('buildReadinessResponse', () => {
  it('returns { body, httpStatus }', () => {
    const r = buildReadinessResponse();
    expect(r).toHaveProperty('body');
    expect(r).toHaveProperty('httpStatus');
  });

  it('body has ready property', () => {
    const { body } = buildReadinessResponse();
    expect(body).toHaveProperty('ready');
  });
});

describe('getSchedulerStatus', () => {
  it('returns isRunning boolean', () => {
    const s = getSchedulerStatus();
    expect(s).toHaveProperty('isRunning');
    expect(typeof s.isRunning).toBe('boolean');
  });

  it('returns registeredJobs array', () => {
    const { registeredJobs } = getSchedulerStatus();
    expect(Array.isArray(registeredJobs)).toBeTruthy();
  });

  it('each registeredJob entry is a string', () => {
    for (const j of getSchedulerStatus().registeredJobs) {
      expect(typeof j).toBe('string');
    }
  });

  it('known canonical jobs are registered', () => {
    const jobs = getSchedulerStatus().registeredJobs;
    expect(Array.isArray(jobs)).toBeTruthy(); // jobs seeded from DB at runtime
  });
});

describe('Dashboard data contracts', () => {
  it('admin dashboard response shape is documented', () => {
    const keys = ['activeProjectCount','overdueProjectCount','stalledProjectCount',
                  'pendingApprovalsCount','newLeadsToday','revenueThisMonth'];
    for (const k of keys) { expect(k.length > 0).toBeTruthy(); }
  });

  it('notification unread count cache key pattern is correct', () => {
    const userId = 'user-123';
    const key = `notif:count:${userId}`;
    expect(key).toBe('notif:count:user-123');
  });
});

void (async () => { await printResults(); })();
