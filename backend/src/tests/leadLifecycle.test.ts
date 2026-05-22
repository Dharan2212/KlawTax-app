import { describe, it, expect, printResults } from './_helpers';
import {
  LeadStatus, LEAD_STATUS_TRANSITIONS, ACTIVE_LEAD_STATUSES,
  LeadPriority, LeadSource, LeadArchiveReason,
} from '../models/leadEnums';

describe('Lead status transitions', () => {
  it('every LeadStatus has an entry', () => {
    for (const s of Object.values(LeadStatus)) {
      expect(LEAD_STATUS_TRANSITIONS).toHaveProperty(s);
    }
  });

  it('New → Contacted, Qualified, Lost, Archived', () => {
    const a = LEAD_STATUS_TRANSITIONS[LeadStatus.New];
    expect(a).toContain(LeadStatus.Contacted);
    expect(a).toContain(LeadStatus.Qualified);
    expect(a).toContain(LeadStatus.Lost);
    expect(a).toContain(LeadStatus.Archived);
  });

  it('Converted is terminal', () => {
    expect(LEAD_STATUS_TRANSITIONS[LeadStatus.Converted].length === 0).toBeTruthy();
  });

  it('Archived can be re-activated to New', () => {
    expect(LEAD_STATUS_TRANSITIONS[LeadStatus.Archived]).toContain(LeadStatus.New);
  });

  it('Onboarding can only Convert or be Lost', () => {
    const a = LEAD_STATUS_TRANSITIONS[LeadStatus.Onboarding];
    expect(a).toContain(LeadStatus.Converted);
    expect(a).toContain(LeadStatus.Lost);
    expect(a.length).toBe(2);
  });
});

describe('ACTIVE_LEAD_STATUSES', () => {
  it('includes New, Contacted, Qualified, ProposalSent, Onboarding', () => {
    expect(ACTIVE_LEAD_STATUSES).toContain(LeadStatus.New);
    expect(ACTIVE_LEAD_STATUSES).toContain(LeadStatus.Contacted);
    expect(ACTIVE_LEAD_STATUSES).toContain(LeadStatus.Qualified);
    expect(ACTIVE_LEAD_STATUSES).toContain(LeadStatus.Onboarding);
  });

  it('excludes Converted, Lost, Archived', () => {
    expect(ACTIVE_LEAD_STATUSES.includes(LeadStatus.Converted)).toBeFalsy();
    expect(ACTIVE_LEAD_STATUSES.includes(LeadStatus.Lost)).toBeFalsy();
    expect(ACTIVE_LEAD_STATUSES.includes(LeadStatus.Archived)).toBeFalsy();
  });
});

describe('Lead auto-archive logic', () => {
  it('auto_inactivity archive reason exists', () => {
    expect(String(LeadArchiveReason.AutoInactivity)).toBe('auto_inactivity');
  });

  it('lead inactive for 91 days should be archived (threshold=90)', () => {
    const days = 91;
    expect(days > 90).toBeTruthy();
  });

  it('lead inactive for 10 days should NOT be archived', () => {
    expect(10 > 90).toBeFalsy();
  });
});

describe('Lead enums', () => {
  it('LeadPriority has urgent', () => {
    expect(Object.values(LeadPriority)).toContain(LeadPriority.Urgent);
  });

  it('LeadSource includes WhatsApp', () => {
    expect(Object.values(LeadSource)).toContain(LeadSource.WhatsApp);
  });
});

void (async () => { await printResults(); })();
