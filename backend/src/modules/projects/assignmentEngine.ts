/**
 * Project Assignment Engine — Batch 3.1
 *
 * Manages all employee assignment operations for projects:
 *   - Adding employees to a project
 *   - Removing / deactivating employees
 *   - Promoting / demoting the primary manager
 *   - Validation rules and duplicate-prevention
 *
 * No DB calls here — all logic is pure and operates on IProject documents.
 * DB persistence happens in projectRepository / projectService.
 */

import { Types } from 'mongoose';
import { BusinessRuleError, ValidationError } from '../../middlewares/errorHandler';
import type { IProject, IAssignedEmployee } from '../../models/project';
import { guardNotTerminal } from './projectWorkflow';

// ─── Assignment Payload Types ─────────────────────────────────────────────────

export interface AssignEmployeePayload {
  userId:            Types.ObjectId;
  employeeProfileId: Types.ObjectId;
  assignedBy:        Types.ObjectId;
  /** If true, this employee becomes the primary manager */
  isPrimary?:        boolean;
}

export interface RemoveEmployeePayload {
  employeeProfileId: Types.ObjectId;
  removedBy:         Types.ObjectId;
}

export interface SetPrimaryManagerPayload {
  employeeProfileId: Types.ObjectId;
  updatedBy:         Types.ObjectId;
}

// ─── Assignment Validation ────────────────────────────────────────────────────

/**
 * Validate that a proposed employee assignment is safe.
 *
 * Checks:
 *   1. The project must not be in a terminal status.
 *   2. The employee must not already be actively assigned.
 *   3. Only one primary manager is allowed at a time.
 *
 * Returns void on success; throws BusinessRuleError on failure.
 */
export function validateAssignEmployee(
  project: IProject,
  payload: AssignEmployeePayload
): void {
  guardNotTerminal(project, 'Employee assignment');

  const activeAssignments = project.assignedEmployees.filter((ae) => ae.isActive);

  // Duplicate prevention
  const alreadyAssigned = activeAssignments.some(
    (ae) => ae.employeeProfileId.toString() === payload.employeeProfileId.toString()
  );

  if (alreadyAssigned) {
    throw new BusinessRuleError(
      'This employee is already actively assigned to the project.',
      { employeeProfileId: payload.employeeProfileId.toString() }
    );
  }

  // Primary manager uniqueness
  if (payload.isPrimary) {
    const existingPrimary = activeAssignments.find((ae) => ae.isPrimary);
    if (existingPrimary) {
      // Allow the caller to demote before re-assigning primary
      throw new BusinessRuleError(
        'A primary manager is already assigned. Demote the existing primary manager before assigning a new one.',
        { currentPrimaryId: existingPrimary.employeeProfileId.toString() }
      );
    }
  }
}

/**
 * Build a new IAssignedEmployee sub-document from a validated payload.
 */
export function buildAssignedEmployee(payload: AssignEmployeePayload): IAssignedEmployee {
  return {
    userId:            payload.userId,
    employeeProfileId: payload.employeeProfileId,
    assignedAt:        new Date(),
    assignedBy:        payload.assignedBy,
    isPrimary:         payload.isPrimary ?? false,
    isActive:          true,
  };
}

/**
 * Apply an employee assignment to a project's assignedEmployees array.
 * Returns the mutated array (does not save to DB).
 *
 * Usage:
 *   project.assignedEmployees = applyAssignEmployee(project, payload);
 *   if (payload.isPrimary) project.primaryManagerId = payload.userId;
 */
export function applyAssignEmployee(
  project: IProject,
  payload: AssignEmployeePayload
): IAssignedEmployee[] {
  validateAssignEmployee(project, payload);
  const entry = buildAssignedEmployee(payload);
  return [...project.assignedEmployees, entry];
}

// ─── Employee Removal ─────────────────────────────────────────────────────────

/**
 * Validate that the employee to be removed is actually assigned.
 */
export function validateRemoveEmployee(
  project: IProject,
  payload: RemoveEmployeePayload
): void {
  guardNotTerminal(project, 'Employee removal');

  const entry = project.assignedEmployees.find(
    (ae) =>
      ae.isActive &&
      ae.employeeProfileId.toString() === payload.employeeProfileId.toString()
  );

  if (!entry) {
    throw new BusinessRuleError(
      'The specified employee is not actively assigned to this project.',
      { employeeProfileId: payload.employeeProfileId.toString() }
    );
  }
}

/**
 * Apply employee removal (soft — marks isActive: false, sets removedAt).
 * Returns the mutated array.
 */
export function applyRemoveEmployee(
  project: IProject,
  payload: RemoveEmployeePayload
): { employees: IAssignedEmployee[]; primaryManagerId: Types.ObjectId | undefined } {
  validateRemoveEmployee(project, payload);

  let newPrimaryManagerId = project.primaryManagerId;

  const updated = project.assignedEmployees.map((ae) => {
    if (
      ae.isActive &&
      ae.employeeProfileId.toString() === payload.employeeProfileId.toString()
    ) {
      if (ae.isPrimary) {
        // Clear primary manager reference if we're removing the primary
        newPrimaryManagerId = undefined;
      }
      return {
        ...ae,
        isActive:  false,
        isPrimary: false,
        removedAt: new Date(),
        removedBy: payload.removedBy,
      } as IAssignedEmployee;
    }
    return ae;
  });

  return { employees: updated, primaryManagerId: newPrimaryManagerId };
}

// ─── Primary Manager Management ───────────────────────────────────────────────

/**
 * Promote an existing assigned employee to primary manager.
 * Automatically demotes any current primary manager.
 *
 * Returns the mutated employees array and the new primaryManagerId.
 */
export function applySetPrimaryManager(
  project: IProject,
  payload: SetPrimaryManagerPayload
): { employees: IAssignedEmployee[]; primaryManagerId: Types.ObjectId } {
  guardNotTerminal(project, 'Primary manager assignment');

  const targetEntry = project.assignedEmployees.find(
    (ae) =>
      ae.isActive &&
      ae.employeeProfileId.toString() === payload.employeeProfileId.toString()
  );

  if (!targetEntry) {
    throw new BusinessRuleError(
      'The specified employee is not actively assigned to this project. Assign them first.',
      { employeeProfileId: payload.employeeProfileId.toString() }
    );
  }

  const updated = project.assignedEmployees.map((ae) => {
    if (!ae.isActive) return ae;
    if (ae.employeeProfileId.toString() === payload.employeeProfileId.toString()) {
      return { ...ae, isPrimary: true } as IAssignedEmployee;
    }
    // Demote any other primary
    if (ae.isPrimary) {
      return { ...ae, isPrimary: false } as IAssignedEmployee;
    }
    return ae;
  });

  return {
    employees: updated,
    primaryManagerId: targetEntry.userId,
  };
}

// ─── Assignment Query Helpers ─────────────────────────────────────────────────

/**
 * Returns the currently active employees on a project.
 */
export function getActiveAssignees(project: IProject): IAssignedEmployee[] {
  return project.assignedEmployees.filter((ae) => ae.isActive);
}

/**
 * Returns the primary manager entry, or undefined if none is set.
 */
export function getPrimaryManager(project: IProject): IAssignedEmployee | undefined {
  return project.assignedEmployees.find((ae) => ae.isActive && ae.isPrimary);
}

/**
 * Check if a given employee (by employeeProfileId) is actively assigned.
 */
export function isEmployeeAssigned(
  project: IProject,
  employeeProfileId: Types.ObjectId
): boolean {
  return project.assignedEmployees.some(
    (ae) =>
      ae.isActive &&
      ae.employeeProfileId.toString() === employeeProfileId.toString()
  );
}

// ─── Assignment Payload Validator ─────────────────────────────────────────────

/**
 * Validate an assign-employee request body.
 * Returns typed payload or throws ValidationError.
 */
export function validateAssignEmployeeInput(body: unknown): {
  employeeProfileId: string;
  userId: string;
  isPrimary?: boolean;
} {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const b = body as Record<string, unknown>;

  if (typeof b.employeeProfileId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(b.employeeProfileId)) {
    throw new ValidationError('"employeeProfileId" must be a valid 24-character ObjectId.');
  }

  if (typeof b.userId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(b.userId)) {
    throw new ValidationError('"userId" must be a valid 24-character ObjectId.');
  }

  const isPrimary = b.isPrimary === true || b.isPrimary === 'true';

  return {
    employeeProfileId: b.employeeProfileId,
    userId: b.userId,
    isPrimary,
  };
}
