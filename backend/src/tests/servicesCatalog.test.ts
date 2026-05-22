import { describe, it, expect, printResults } from './_helpers';
import { SERVICE_SEED_DATA } from '../seeds/services.seed';
import { ServicePrimaryCategory } from '../models/serviceEnums';

describe('Services catalog — canonical count', () => {
  it('contains exactly 26 seed records', () => {
    expect(SERVICE_SEED_DATA.length).toBe(26);
  });

  it('24 records are active', () => {
    expect(SERVICE_SEED_DATA.filter(s => s.isActive !== false).length).toBe(24);
  });

  it('2 records are inactive (DIN, DSC)', () => {
    const inactive = SERVICE_SEED_DATA.filter(s => s.isActive === false);
    expect(inactive.length).toBe(2);
    const slugs = inactive.map(s => s.slug);
    expect(slugs).toContain('din-registration');
    expect(slugs).toContain('dsc-registration');
  });

  it('exactly 1 bundle', () => {
    const bundles = SERVICE_SEED_DATA.filter(s => s.isBundle === true);
    expect(bundles.length).toBe(1);
    expect(bundles[0]!.slug).toBe('section-8-complete-package');
  });
});

describe('Services catalog — slug uniqueness', () => {
  it('all slugs are unique', () => {
    const slugs = SERVICE_SEED_DATA.map(s => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all slugs are lowercase kebab-case', () => {
    const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const s of SERVICE_SEED_DATA) {
      expect(pattern.test(s.slug)).toBeTruthy();
    }
  });
});

describe('Bundle — Section 8 Complete Package', () => {
  const bundle = SERVICE_SEED_DATA.find(s => s.slug === 'section-8-complete-package');

  it('bundle exists', () => { expect(!!bundle).toBeTruthy(); });

  it('bundle price is ₹13,500', () => {
    expect(bundle?.basePrice).toBe(13500);
  });

  it('advance price is ₹6,750', () => {
    expect(bundle?.advancePrice).toBe(6750);
  });

  it('has ≥6 bundled service slugs', () => {
    expect((bundle?.bundledServiceSlugs?.length ?? 0) >= 6).toBeTruthy();
  });

  it('includes section-8-registration', () => {
    expect(bundle?.bundledServiceSlugs).toContain('section-8-registration');
  });

  it('is featured', () => {
    expect(bundle?.isFeatured).toBeTruthy();
  });
});

describe('Services catalog — pricing', () => {
  it('Section 8 standalone is ₹8,000', () => {
    const s8 = SERVICE_SEED_DATA.find(s => s.slug === 'section-8-registration');
    expect(s8?.basePrice).toBe(8000);
  });

  it('all active non-bundle services have basePrice > 0', () => {
    for (const s of SERVICE_SEED_DATA.filter(s => s.isActive !== false && !s.isBundle)) {
      expect((s.basePrice ?? 0) > 0).toBeTruthy();
    }
  });

  it('advancePrice is always ≤ basePrice when set', () => {
    for (const s of SERVICE_SEED_DATA) {
      if (s.advancePrice !== null && s.advancePrice !== undefined && s.basePrice) {
        expect(s.advancePrice <= s.basePrice).toBeTruthy();
      }
    }
  });
});

describe('Services catalog — categories', () => {
  it('NGO and Business categories are represented', () => {
    const cats = new Set(SERVICE_SEED_DATA.map(s => s.primaryCategory));
    expect(cats.has(ServicePrimaryCategory.NgoRegistration)).toBeTruthy();
    expect(cats.has(ServicePrimaryCategory.BusinessCompliance)).toBeTruthy();
    expect(cats.has(ServicePrimaryCategory.Digital)).toBeTruthy();
  });
});

void (async () => { await printResults(); })();
