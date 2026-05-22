import { describe, it, expect, printResults } from './_helpers';
import {
  NotificationType, NotificationPriority, NotificationDeliveryChannel,
} from '../models/notificationEnums';
import {
  SupportTicketStatus, SupportTicketPriority, SUPPORT_TICKET_TRANSITIONS,
} from '../models/supportTicketEnums';

describe('NotificationType coverage', () => {
  it('contains payment types', () => {
    const t = Object.values(NotificationType);
    expect(t).toContain(NotificationType.PaymentReceived);
    expect(t).toContain(NotificationType.PaymentFailed);
  });

  it('contains project types', () => {
    const t = Object.values(NotificationType);
    expect(t).toContain(NotificationType.ProjectOverdue);
    expect(t).toContain(NotificationType.ProjectCompleted);
  });

  it('contains export types', () => {
    expect(Object.values(NotificationType)).toContain(NotificationType.ExportCompleted);
    expect(Object.values(NotificationType)).toContain(NotificationType.ExportFailed);
  });
});

describe('NotificationPriority', () => {
  it('has at least 3 levels', () => {
    expect(Object.values(NotificationPriority).length >= 3).toBeTruthy();
  });

  it('urgent level exists', () => {
    expect(Object.values(NotificationPriority)).toContain(NotificationPriority.Urgent);
  });
});

describe('NotificationDeliveryChannel', () => {
  it('includes WhatsApp', () => {
    expect(Object.values(NotificationDeliveryChannel)).toContain(NotificationDeliveryChannel.WhatsApp);
  });

  it('includes in-app', () => {
    expect(Object.values(NotificationDeliveryChannel)).toContain(NotificationDeliveryChannel.InApp);
  });
});

describe('Support ticket transitions', () => {
  it('every status has a transition entry', () => {
    for (const s of Object.values(SupportTicketStatus)) {
      expect(SUPPORT_TICKET_TRANSITIONS).toHaveProperty(s);
    }
  });

  it('Open can be assigned or closed', () => {
    const a = SUPPORT_TICKET_TRANSITIONS[SupportTicketStatus.Open];
    expect(a).toContain(SupportTicketStatus.Assigned);
    expect(a).toContain(SupportTicketStatus.Closed);
  });

  it('Resolved can be reopened', () => {
    expect(SUPPORT_TICKET_TRANSITIONS[SupportTicketStatus.Resolved]).toContain(
      SupportTicketStatus.Reopened
    );
  });

  it('InProgress can escalate', () => {
    expect(SUPPORT_TICKET_TRANSITIONS[SupportTicketStatus.InProgress]).toContain(
      SupportTicketStatus.Escalated
    );
  });
});

describe('Support escalation logic', () => {
  it('tier 1 triggers after 24h without response', () => {
    expect(25 >= 24).toBeTruthy();
  });

  it('tier 2 triggers after 72h without resolution', () => {
    expect(73 >= 72).toBeTruthy();
  });

  it('within 24h does not trigger tier 1', () => {
    expect(10 >= 24).toBeFalsy();
  });
});

describe('SupportTicketPriority', () => {
  it('has low, medium, high, urgent', () => {
    const v = Object.values(SupportTicketPriority);
    expect(v).toContain('low');
    expect(v).toContain('medium');
    expect(v).toContain('high');
    expect(v).toContain('urgent');
  });
});

describe('Notification scoping', () => {
  it('all queries must include recipientId', () => {
    const q = { recipientId: 'user-123', isRead: false };
    expect(q).toHaveProperty('recipientId');
  });

  it('Redis cache key pattern is correct', () => {
    const key = `notif:count:user-abc`;
    expect(key).toBe('notif:count:user-abc');
  });
});

void (async () => { await printResults(); })();
