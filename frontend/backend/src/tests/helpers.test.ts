import { describe, it, expect, printResults, fakeId } from './_helpers';
import {
  generateSignedUrl, validateSignedToken, SIGNED_URL_EXPIRY,
  generateSensitiveUrl, generateExportUrl,
} from '../utils/signedUrl';
import {
  parsePaginationParams, buildPaginationMeta, toMongoosePagination,
  MAX_PAGE_LIMIT, DEFAULT_PAGE_LIMIT,
} from '../utils/pagination/index';
import { buildKeywordFilter, buildStatusFilter } from '../utils/search/index';

// ── Helper to extract just the JWT token from the generated URL ───────────────
function extractToken(urlOrToken: string): string {
  try {
    return new URL(urlOrToken).searchParams.get('token') ?? urlOrToken;
  } catch {
    return urlOrToken;
  }
}

// ─── Signed URL expiry ────────────────────────────────────────────────────────

describe('SIGNED_URL_EXPIRY', () => {
  it('STANDARD is 900s',  () => { expect(SIGNED_URL_EXPIRY.STANDARD).toBe(900); });
  it('SENSITIVE is 300s', () => { expect(SIGNED_URL_EXPIRY.SENSITIVE).toBe(300); });
  it('EXPORT is 3600s',   () => { expect(SIGNED_URL_EXPIRY.EXPORT).toBe(3600); });
  it('ordering: SENSITIVE < STANDARD < EXPORT', () => {
    expect(SIGNED_URL_EXPIRY.SENSITIVE < SIGNED_URL_EXPIRY.STANDARD).toBeTruthy();
    expect(SIGNED_URL_EXPIRY.STANDARD  < SIGNED_URL_EXPIRY.EXPORT).toBeTruthy();
  });
});

// ─── Signed URL generation & validation ──────────────────────────────────────

describe('generateSignedUrl + validateSignedToken', () => {
  const baseOpts = () => ({ storagePath: 'docs/test.pdf', ownerId: fakeId(), ownerRole: 'client' });

  it('generates a non-empty URL', () => {
    const url = generateSignedUrl({ ...baseOpts(), expirySeconds: SIGNED_URL_EXPIRY.STANDARD });
    expect(url.length > 0).toBeTruthy();
  });

  it('valid token extracted from URL passes validation', () => {
    const opts = baseOpts();
    const url   = generateSignedUrl({ ...opts, expirySeconds: SIGNED_URL_EXPIRY.STANDARD });
    const token = extractToken(url);
    const r = validateSignedToken(token);
    expect(r.valid).toBeTruthy();
    expect(r.payload?.ownerId).toBe(opts.ownerId);
  });

  it('tampered token fails validation', () => {
    const url   = generateSignedUrl({ ...baseOpts(), expirySeconds: SIGNED_URL_EXPIRY.STANDARD });
    const token = extractToken(url);
    expect(validateSignedToken(token.slice(0, -5) + 'XXXXX').valid).toBeFalsy();
  });

  it('generateSensitiveUrl produces a valid token', () => {
    const url   = generateSensitiveUrl(baseOpts());
    const token = extractToken(url);
    expect(validateSignedToken(token).valid).toBeTruthy();
  });

  it('generateExportUrl produces a valid token', () => {
    const url   = generateExportUrl(baseOpts());
    const token = extractToken(url);
    expect(validateSignedToken(token).valid).toBeTruthy();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('parsePaginationParams', () => {
  it('defaults: page=1, limit=DEFAULT', () => {
    const r = parsePaginationParams({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(DEFAULT_PAGE_LIMIT);
  });

  it('parses page and limit from strings', () => {
    const r = parsePaginationParams({ page: '3', limit: '10' });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(10);
  });

  it('clamps limit to MAX_PAGE_LIMIT', () => {
    const r = parsePaginationParams({ page: '1', limit: '9999' });
    expect(r.limit <= MAX_PAGE_LIMIT).toBeTruthy();
  });

  it('falls back to defaults on non-numeric input', () => {
    const r = parsePaginationParams({ page: 'abc', limit: 'xyz' });
    expect(r.page).toBe(1);
    expect(r.limit).toBe(DEFAULT_PAGE_LIMIT);
  });
});

describe('buildPaginationMeta', () => {
  it('calculates totalPages = ceil(total/limit)', () => {
    expect(buildPaginationMeta(1, 10, 95).totalPages).toBe(10);
  });

  it('hasNextPage is true on first of multiple pages', () => {
    expect(buildPaginationMeta(1, 10, 50).hasNextPage).toBeTruthy();
  });

  it('hasNextPage is false on the last page', () => {
    expect(buildPaginationMeta(5, 10, 50).hasNextPage).toBeFalsy();
  });
});

describe('toMongoosePagination', () => {
  it('page 3 limit 10 → skip 20', () => {
    const p = parsePaginationParams({ page: '3', limit: '10' });
    expect(toMongoosePagination(p).skip).toBe(20);
  });

  it('page 1 → skip 0', () => {
    const p = parsePaginationParams({ page: '1', limit: '20' });
    expect(toMongoosePagination(p).skip).toBe(0);
  });
});

// ─── Search helpers ───────────────────────────────────────────────────────────

describe('buildKeywordFilter', () => {
  it('returns null or empty for blank keyword', () => {
    const f = buildKeywordFilter<{ name: string }>('', ['name']);
    const isEmpty = f === null || (typeof f === 'object' && Object.keys(f as object).length === 0);
    expect(isEmpty).toBeTruthy();
  });

  it('returns $or filter for non-empty keyword', () => {
    const f = buildKeywordFilter<{ name: string; email: string }>('ramesh', ['name', 'email']);
    const hasOr = f !== null && '$or' in (f as object);
    expect(hasOr).toBeTruthy();
  });
});

describe('buildStatusFilter', () => {
  it('returns null for undefined status', () => {
    const f = buildStatusFilter<string>(undefined, ['active','inactive']);
    expect(f === null).toBeTruthy();
  });

  it('returns filter for valid status', () => {
    const f = buildStatusFilter<string>('active', ['active','inactive']);
    expect(f !== null).toBeTruthy();
  });
});

void (async () => { await printResults(); })();
