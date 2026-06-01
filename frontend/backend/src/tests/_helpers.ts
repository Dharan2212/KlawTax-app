/**
 * Shared test helpers for KlawTax backend unit/integration tests.
 *
 * Designed to be run with `tsx` directly, or replaced by Jest/Vitest later.
 * The `describe/it/expect` shim collects tests synchronously; `printResults()`
 * executes all pending tests asynchronously and reports results.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type TestFn = () => void | Promise<void>;

interface PendingTest { label: string; fn: TestFn; }
interface TestResult  { name: string; pass: boolean; error: string | null; }

// ── State ─────────────────────────────────────────────────────────────────────

const _pending: PendingTest[] = [];
let _currentSuite = '';

// ── Registration helpers ──────────────────────────────────────────────────────

export function describe(suite: string, fn: () => void): void {
  const prev = _currentSuite;
  _currentSuite = suite;
  fn();
  _currentSuite = prev;
}

export function it(name: string, fn: TestFn): void {
  const label = _currentSuite ? `${_currentSuite} > ${name}` : name;
  _pending.push({ label, fn });
}

export const test = it;

// ── Assertions ────────────────────────────────────────────────────────────────

export function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual(expected: unknown) {
      const a = JSON.stringify(actual), b = JSON.stringify(expected);
      if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    },
    toContain(item: unknown) {
      if (!Array.isArray(actual)) throw new Error('toContain requires an array');
      const found = (actual as unknown[]).some(el => JSON.stringify(el) === JSON.stringify(item));
      if (!found) throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
    },
    toThrow(msgFragment?: string) {
      const fn = actual as unknown as () => void;
      let threw = false, message = '';
      try { fn(); } catch (err: unknown) {
        threw = true;
        message = err instanceof Error ? err.message : String(err);
      }
      if (!threw) throw new Error('Expected function to throw');
      if (msgFragment && !message.includes(msgFragment))
        throw new Error(`Expected error "${msgFragment}", got "${message}"`);
    },
    toHaveProperty(key: string) {
      if (typeof actual !== 'object' || actual === null)
        throw new Error('toHaveProperty requires an object');
      if (!(key in (actual as Record<string, unknown>)))
        throw new Error(`Expected object to have property "${key}"`);
    },
    toBeGreaterThan(n: number) {
      if ((actual as unknown as number) <= n)
        throw new Error(`Expected ${actual} to be > ${n}`);
    },
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────

/** Execute pending tests and print results. Call at end of every test file. */
export async function printResults(): Promise<void> {
  const results: TestResult[] = [];
  for (const { label, fn } of _pending) {
    try {
      await fn();
      results.push({ name: label, pass: true, error: null });
    } catch (err: unknown) {
      results.push({ name: label, pass: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  _pending.length = 0;

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log('\n─── Test Results ──────────────────────────────────────────');
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'}  ${r.name}`);
    if (!r.pass) console.log(`     Error: ${r.error}`);
  }
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${results.length}`);
  if (failed > 0) process.exit(1);
}

// ── Fake data factories ────────────────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';

export function fakeId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function fakeUser(overrides: Record<string, unknown> = {}) {
  return { _id: fakeId(), email: `user-${uuidv4().slice(0,8)}@klawtax.test`, role: 'client', accountStatus: 'active', isEmailVerified: true, createdAt: new Date(), ...overrides };
}

export function fakeService(overrides: Record<string, unknown> = {}) {
  return { _id: fakeId(), name: 'Section 8 Registration', slug: 'section-8-registration', category: 'ngo_registration', price: 8000, advancePrice: 4000, isActive: true, isBundle: false, createdAt: new Date(), ...overrides };
}

export function fakeProject(overrides: Record<string, unknown> = {}) {
  return { _id: fakeId(), projectNumber: 'KT-2026-001', clientId: fakeId(), serviceId: fakeId(), status: 'onboarding', paymentStatus: 'pending', isBundle: false, isStalled: false, isOverdue: false, createdAt: new Date(), ...overrides };
}

export function fakeLead(overrides: Record<string, unknown> = {}) {
  return { _id: fakeId(), name: 'Ramesh Kumar', email: `lead-${uuidv4().slice(0,6)}@example.com`, phone: '+919876543210', status: 'new', createdAt: new Date(), ...overrides };
}

export function fakeInvoice(overrides: Record<string, unknown> = {}) {
  return { _id: fakeId(), invoiceNumber: 'INV-2026-001', clientId: fakeId(), projectId: fakeId(), totalAmount: 13500, amountPaid: 0, status: 'draft', createdAt: new Date(), ...overrides };
}
