/**
 * Project Workflow Engine — Batch 3.1
 *
 * Central lifecycle logic for the KlawTax project system.
 *
 * Responsibilities:
 *   - Status transition validation (with detailed error reporting)
 *   - Lifecycle timestamp management
 *   - Delivery-type-aware completion gate
 *   - Workflow guard utilities
 *
 * This is a pure-logic module — no DB calls, no side effects.
 * All DB interaction lives in projectRepository / projectService.
 */

import { Types } from 'mongoose';
import {
  ProjectStatus,
  PROJECT_STATUS_TRANSITIONS,
  TERMINAL_PROJECT_STATUSES,
  DeliveryRequirementType,
  ChecklistItemStatus,
} from '../../models/projectEnums';
import { ServiceDeliveryType } from '../../models/serviceEnums';
import { AppError, BusinessRuleError } from '../../middlewares/errorHandler';
import type { IProject, IStatusHistoryEntry, IChecklistItem } from '../../models/project';

// ─── Transition Validation ────────────────────────────────────────────────────

/**
 * Validate a proposed project status transition.
 *
 * Throws `BusinessRuleError` with error code `INVALID_STATUS_TRANSITION` if
 * the transition is not permitted.  Returns void on success.
 *
 * Usage:
 *   validateProjectTransition(project.projectStatus, ProjectStatus.Active);
 */
export function validateProjectTransition(
  from: ProjectStatus,
  to: ProjectStatus
): void {
  if (from === to) {
    throw new BusinessRuleError(
      `Project is already in status "${from}" — no transition needed.`,
      { from, to }
    );
  }

  if (TERMINAL_PROJECT_STATUSES.has(from)) {
    throw new BusinessRuleError(
      `Cannot transition project from terminal status "${from}".`,
      { from, to }
    );
  }

  const allowed = PROJECT_STATUS_TRANSITIONS[from];

  if (!allowed.includes(to)) {
    throw new AppError(
      `Cannot transition project from "${from}" to "${to}". ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none'}.`,
      422,
      'INVALID_STATUS_TRANSITION',
      { from, to, allowed }
    );
  }
}

/**
 * Returns the allowed next statuses for a given current status.
 * Safe to call for UI population — does not throw.
 */
export function getAllowedTransitions(from: ProjectStatus): ProjectStatus[] {
  if (TERMINAL_PROJECT_STATUSES.has(from)) return [];
  return PROJECT_STATUS_TRANSITIONS[from] ?? [];
}

// ─── Lifecycle Timestamp Logic ────────────────────────────────────────────────

/**
 * Compute lifecycle timestamp updates when a project transitions to a new status.
 * Returns a partial update object to be merged into the project document.
 */
export function buildLifecycleTimestamps(
  to: ProjectStatus
): Partial<Pick<
  IProject,
  | 'startedAt'
  | 'completedAt'
  | 'deliveredAt'
  | 'archivedAt'
  | 'cancelledAt'
  | 'lastActivityAt'
>> {
  const now = new Date();
  const updates: Partial<IProject> = { lastActivityAt: now };

  switch (to) {
    case ProjectStatus.Active:
    case ProjectStatus.Onboarding:
      // Only set startedAt on the first time we enter an active state
      // (handled conditionally in service layer)
      break;
    case ProjectStatus.Completed:
      updates.completedAt = now;
      break;
    case ProjectStatus.Delivered:
      updates.deliveredAt = now;
      break;
    case ProjectStatus.Archived:
      updates.archivedAt = now;
      break;
    case ProjectStatus.Cancelled:
      updates.cancelledAt = now;
      break;
  }

  return updates;
}

/**
 * Build a new status history entry for the transition.
 */
export function buildStatusHistoryEntry(
  status: ProjectStatus,
  changedBy: Types.ObjectId,
  note?: string
): IStatusHistoryEntry {
  return {
    status,
    changedAt: new Date(),
    changedBy,
    ...(note ? { note } : {}),
  };
}

// ─── Completion Gate (Delivery-Type-Aware) ────────────────────────────────────

/**
 * Completion gate result.
 */
export interface CompletionGateResult {
  canComplete: boolean;
  blockedByRequirements: string[];
  pendingChecklistItems: string[];
}

/**
 * Maps ServiceDeliveryType → the DeliveryRequirementType(s) that must be
 * satisfied before a project of that type can reach Completed status.
 *
 * This is the ONLY place where delivery-type rules are defined.
 * Do not scatter delivery logic across modules.
 */
const DELIVERY_TYPE_REQUIREMENTS: Readonly<Record<string, DeliveryRequirementType[]>> = {
  [ServiceDeliveryType.Registration]: [DeliveryRequirementType.RegistrationCertificate],
  [ServiceDeliveryType.Compliance]:   [DeliveryRequirementType.ComplianceFiling],
  [ServiceDeliveryType.Audit]:        [DeliveryRequirementType.AuditReport],
  [ServiceDeliveryType.Reporting]:    [DeliveryRequirementType.ReportDocument],
  [ServiceDeliveryType.Digital]:      [DeliveryRequirementType.DigitalDeliverable],
  [ServiceDeliveryType.Hosting]:      [DeliveryRequirementType.HostingDeployment],
  [ServiceDeliveryType.Marketing]:    [DeliveryRequirementType.MarketingDeliverable],
  [ServiceDeliveryType.Consulting]:   [DeliveryRequirementType.ConsultingDeliverable],
};

/**
 * Validate that a project may transition to Completed.
 *
 * Checks:
 *   1. All completion checklist items that are not Waived must be Completed.
 *   2. All delivery-type-required checklist items must exist and be Completed.
 *
 * Returns a `CompletionGateResult` — never throws.  Callers decide whether to
 * block the transition.
 *
 * Note: In Batch 3.1 the checklist is fully modelled but document/file checks
 * are not yet wired (that comes with the documents module in Batch 3.3).
 * The gate validates the checklist state as stored on the project.
 */
export function evaluateCompletionGate(project: IProject): CompletionGateResult {
  const blockedByRequirements: string[] = [];
  const pendingChecklistItems: string[] = [];

  const checklist = project.completionChecklist ?? [];

  // 1. Check every required checklist item (non-waived)
  const requiredItems = checklist.filter(
    (item) => item.status !== ChecklistItemStatus.Waived
  );

  for (const item of requiredItems) {
    if (item.status !== ChecklistItemStatus.Completed) {
      pendingChecklistItems.push(item.key);
    }
  }

  // 2. Check that each required delivery type has at least one completed item
  const deliveryTypes = project.serviceDeliveryTypes ?? [];
  const completedTypes = new Set(
    checklist
      .filter((item) => item.status === ChecklistItemStatus.Completed)
      .map((item) => item.requirementType)
  );

  for (const deliveryType of deliveryTypes) {
    const requiredTypes = DELIVERY_TYPE_REQUIREMENTS[deliveryType];
    if (!requiredTypes) continue;

    for (const reqType of requiredTypes) {
      const itemsForType = checklist.filter((item) => item.requirementType === reqType);

      // If no checklist item of this type exists OR none are completed
      if (itemsForType.length === 0 || !completedTypes.has(reqType)) {
        if (!blockedByRequirements.includes(reqType)) {
          blockedByRequirements.push(reqType);
        }
      }
    }
  }

  const canComplete =
    pendingChecklistItems.length === 0 && blockedByRequirements.length === 0;

  return { canComplete, blockedByRequirements, pendingChecklistItems };
}

/**
 * Build the default completion checklist for a project based on its delivery types.
 *
 * Called at project creation to pre-populate the checklist structure.
 * All items start as Pending — employees mark them complete as work progresses.
 */
export function buildDefaultChecklist(deliveryTypes: string[]): IChecklistItem[] {
  const items: IChecklistItem[] = [];
  const seen = new Set<DeliveryRequirementType>();

  for (const deliveryType of deliveryTypes) {
    const requiredTypes = DELIVERY_TYPE_REQUIREMENTS[deliveryType];
    if (!requiredTypes) continue;

    for (const reqType of requiredTypes) {
      if (seen.has(reqType)) continue;
      seen.add(reqType);

      items.push({
        key:             reqType,
        label:           REQUIREMENT_LABELS[reqType] ?? reqType,
        requirementType: reqType,
        status:          ChecklistItemStatus.Pending,
      });
    }
  }

  return items;
}

/** Human-readable labels for checklist items */
const REQUIREMENT_LABELS: Record<DeliveryRequirementType, string> = {
  [DeliveryRequirementType.RegistrationCertificate]: 'Registration certificate received from government',
  [DeliveryRequirementType.ComplianceFiling]:         'Compliance filing submitted and acknowledged',
  [DeliveryRequirementType.AuditReport]:              'Audit report with UDIN generated and signed',
  [DeliveryRequirementType.ReportDocument]:           'Report document drafted and approved',
  [DeliveryRequirementType.DigitalDeliverable]:       'Digital deliverable deployed and tested',
  [DeliveryRequirementType.HostingDeployment]:        'Hosting infrastructure deployed and verified',
  [DeliveryRequirementType.MarketingDeliverable]:     'Marketing campaign launched and report submitted',
  [DeliveryRequirementType.ConsultingDeliverable]:    'Consulting engagement summary delivered',
};

// ─── Progress Calculation ─────────────────────────────────────────────────────

/**
 * Derive a progress percentage from the completion checklist.
 * Returns 0 if the checklist is empty.
 */
export function calculateProgressFromChecklist(checklist: IChecklistItem[]): number {
  const required = checklist.filter((item) => item.status !== ChecklistItemStatus.Waived);
  if (required.length === 0) return 0;

  const completed = required.filter((item) => item.status === ChecklistItemStatus.Completed);
  return Math.round((completed.length / required.length) * 100);
}

// ─── Workflow Guard Utilities ─────────────────────────────────────────────────

/**
 * Throw if the project is in a terminal status.
 * Used in update/assignment operations that cannot touch archived/cancelled projects.
 */
export function guardNotTerminal(project: IProject, operationLabel = 'This operation'): void {
  if (TERMINAL_PROJECT_STATUSES.has(project.projectStatus)) {
    throw new BusinessRuleError(
      `${operationLabel} cannot be performed on a project in "${project.projectStatus}" status.`
    );
  }
}

/**
 * Throw if the requesting employee is not assigned to the project.
 * Admins are not checked (should be pre-checked by RBAC).
 */
export function guardEmployeeAssigned(
  project: IProject,
  employeeProfileId: Types.ObjectId
): void {
  const isAssigned = project.assignedEmployees.some(
    (ae) =>
      ae.isActive &&
      ae.employeeProfileId.toString() === employeeProfileId.toString()
  );

  if (!isAssigned) {
    throw new BusinessRuleError(
      'You are not assigned to this project and cannot perform this action.'
    );
  }
}
