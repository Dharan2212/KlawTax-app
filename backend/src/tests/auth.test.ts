import { describe, it, expect, printResults, fakeId } from './_helpers';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, expiryDate } from '../utils/jwt';
import { Role } from '../utils/permissions';

describe('JWT — signAccessToken', () => {
  it('returns token, jti, and expiresIn', () => {
    const r = signAccessToken({ userId: fakeId(), role: Role.Admin, email: 'a@t.com', accountStatus: 'active', permissions: [] });
    expect(typeof r.token).toBe('string');
    expect(typeof r.jti).toBe('string');
    expect(typeof r.expiresIn).toBe('number');
  });

  it('encodes role and email in payload', () => {
    const userId = fakeId();
    const { token } = signAccessToken({ userId, role: Role.Employee, email: 'emp@t.com', accountStatus: 'active', permissions: [] });
    const payload = verifyAccessToken(token);
    expect(payload.role).toBe(Role.Employee);
    expect(payload.email).toBe('emp@t.com');
    expect(payload.sub).toBe(userId);
  });

  it('two tokens for different users produce different jtis', () => {
    const a = signAccessToken({ userId: fakeId(), role: Role.Client, email: 'a@t.com', accountStatus: 'active', permissions: [] });
    const b = signAccessToken({ userId: fakeId(), role: Role.Client, email: 'b@t.com', accountStatus: 'active', permissions: [] });
    const same = a.jti === b.jti;
    expect(same).toBeFalsy();
  });
});

describe('JWT — signRefreshToken', () => {
  it('returns token, jti, and expiresIn', () => {
    const r = signRefreshToken(fakeId(), 'fam-1');
    expect(typeof r.token).toBe('string');
    expect(typeof r.jti).toBe('string');
    expect(r.expiresIn).toBeGreaterThan(0);
  });

  it('encodes family and type=refresh', () => {
    const { token } = signRefreshToken(fakeId(), 'test-family');
    const p = verifyRefreshToken(token);
    expect(p.family).toBe('test-family');
    expect(p.type).toBe('refresh');
  });
});

describe('JWT — expiryDate', () => {
  it('returns a Date ~N seconds in the future', () => {
    const secs = 3600;
    const d = expiryDate(secs);
    const diff = d.getTime() - Date.now();
    expect(diff > (secs - 5) * 1000).toBeTruthy();
    expect(diff < (secs + 5) * 1000).toBeTruthy();
  });
});

describe('JWT — tamper detection', () => {
  it('throws on tampered access token', () => {
    const { token } = signAccessToken({ userId: fakeId(), role: Role.Admin, email: 'x@t.com', accountStatus: 'active', permissions: [] });
    expect(() => verifyAccessToken(token.slice(0, -4) + 'XXXX')).toThrow();
  });

  it('throws on completely invalid string', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrow();
  });
});

void (async () => { await printResults(); })();
