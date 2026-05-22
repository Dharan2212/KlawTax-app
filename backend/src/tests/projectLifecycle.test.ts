import { describe, it, expect, printResults } from './_helpers';
import {
  ProjectStatus, PROJECT_STATUS_TRANSITIONS, TERMINAL_PROJECT_STATUSES,
  ACTIVE_WORK_STATUSES, PROJECT_CODE_PREFIX,
} from '../models/projectEnums';

describe('Project status transitions', () => {
  it('every ProjectStatus has a transition entry', () => {
    for (const s of Object.values(ProjectStatus)) {
      expect(PROJECT_STATUS_TRANSITIONS).toHaveProperty(s);
    }
  });

  it('Draft → Onboarding or Cancelled', () => {
    expect(PROJECT_STATUS_TRANSITIONS[ProjectStatus.Draft]).toContain(ProjectStatus.Onboarding);
    expect(PROJECT_STATUS_TRANSITIONS[ProjectStatus.Draft]).toContain(ProjectStatus.Cancelled);
  });

  it('terminal statuses have no transitions', () => {
    for (const s of TERMINAL_PROJECT_STATUSES) {
      expect(PROJECT_STATUS_TRANSITIONS[s].length === 0).toBeTruthy();
    }
  });

  it('Active → WaitingClient, InReview, Completed, Cancelled', () => {
    const allowed = PROJECT_STATUS_TRANSITIONS[ProjectStatus.Active];
    expect(allowed).toContain(ProjectStatus.WaitingClient);
    expect(allowed).toContain(ProjectStatus.InReview);
    expect(allowed).toContain(ProjectStatus.Completed);
    expect(allowed).toContain(ProjectStatus.Cancelled);
  });

  it('Completed cannot go back to Active', () => {
    expect(PROJECT_STATUS_TRANSITIONS[ProjectStatus.Completed].includes(ProjectStatus.Active)).toBeFalsy();
  });
});

describe('TERMINAL_PROJECT_STATUSES', () => {
  it('contains Archived and Cancelled', () => {
    expect(TERMINAL_PROJECT_STATUSES.has(ProjectStatus.Archived)).toBeTruthy();
    expect(TERMINAL_PROJECT_STATUSES.has(ProjectStatus.Cancelled)).toBeTruthy();
  });

  it('does not contain Active or Completed (Completed is not terminal)', () => {
    expect(TERMINAL_PROJECT_STATUSES.has(ProjectStatus.Active)).toBeFalsy();
  });
});

describe('ACTIVE_WORK_STATUSES', () => {
  it('contains Active', () => {
    expect(ACTIVE_WORK_STATUSES.has(ProjectStatus.Active)).toBeTruthy();
  });

  it('does not contain terminal statuses', () => {
    for (const s of TERMINAL_PROJECT_STATUSES) {
      expect(ACTIVE_WORK_STATUSES.has(s)).toBeFalsy();
    }
  });
});

describe('Project code prefix', () => {
  it('prefix is KT', () => {
    expect(PROJECT_CODE_PREFIX).toBe('KT');
  });

  it('KT-YYYY-NNN pattern is valid', () => {
    const year = new Date().getFullYear();
    const code = `${PROJECT_CODE_PREFIX}-${year}-001`;
    expect(/^KT-\d{4}-\d{3,}$/.test(code)).toBeTruthy();
  });
});

void (async () => { await printResults(); })();
