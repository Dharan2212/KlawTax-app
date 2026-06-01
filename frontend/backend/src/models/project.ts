/**
 * Project model — Batch 3.1
 *
 * The central entity in the KlawTax CRM.  Every paid service engagement is
 * represented as one or more Project records.  Bundle purchases create a
 * billing-anchor project plus one sub-project per bundled service.
 *
 * Design principles:
 *   - Workflow-safe: every lifecycle field is carefully typed
 *   - Analytics-ready: dates, counters, and metadata fully indexed
 *   - Assignment-safe: multi-employee support with role clarity
 *   - Future-compatible: references to documents, tasks, and invoices via ObjectId fields
 */

import { Schema, Document, model, Types } from 'mongoose';
import {
  ProjectStatus,
  ProjectPriority,
  CancellationReason,
  DeliveryRequirementType,
  ChecklistItemStatus,
  PROJECT_CODE_PREFIX,
} from './projectEnums';

// ─── Sub-document: Assigned Employee ─────────────────────────────────────────

export interface IAssignedEmployee {
  userId:            Types.ObjectId;
  employeeProfileId: Types.ObjectId;
  assignedAt:        Date;
  assignedBy:        Types.ObjectId;
  /** isPrimary marks the lead manager for this project. */
  isPrimary:         boolean;
  isActive:          boolean;
  /** For future reassignment audit trail */
  removedAt?:        Date;
  removedBy?:        Types.ObjectId;
}

const AssignedEmployeeSchema = new Schema<IAssignedEmployee>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeProfileId: { type: Schema.Types.ObjectId, ref: 'EmployeeProfile', required: true },
    assignedAt:        { type: Date, default: () => new Date() },
    assignedBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPrimary:         { type: Boolean, default: false },
    isActive:          { type: Boolean, default: true },
    removedAt:         { type: Date },
    removedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

// ─── Sub-document: Completion Checklist Item ─────────────────────────────────

export interface IChecklistItem {
  key:            string;
  label:          string;
  requirementType: DeliveryRequirementType;
  status:         ChecklistItemStatus;
  completedAt?:   Date;
  completedBy?:   Types.ObjectId;
  notes?:         string;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    key:             { type: String, required: true, maxlength: 100 },
    label:           { type: String, required: true, maxlength: 200 },
    requirementType: {
      type: String,
      enum: Object.values(DeliveryRequirementType),
      required: true,
    },
    status:    { type: String, enum: Object.values(ChecklistItemStatus), default: ChecklistItemStatus.Pending },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes:       { type: String, maxlength: 1000 },
  },
  { _id: false }
);

// ─── Sub-document: Status History Entry ──────────────────────────────────────

export interface IStatusHistoryEntry {
  status:     ProjectStatus;
  changedAt:  Date;
  changedBy:  Types.ObjectId;
  note?:      string;
}

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status:    { type: String, enum: Object.values(ProjectStatus), required: true },
    changedAt: { type: Date, default: () => new Date() },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note:      { type: String, maxlength: 1000 },
  },
  { _id: false }
);

// ─── Main Project Document Interface ─────────────────────────────────────────

export interface IProject extends Document {
  // ── Identity ────────────────────────────────────────────────────────────────
  /** Auto-generated code: KT-00001 */
  projectCode:     string;
  title:           string;
  description?:    string;

  // ── Relationships ───────────────────────────────────────────────────────────
  clientId:          Types.ObjectId;
  /** Optional — set when created from a lead conversion */
  leadId?:           Types.ObjectId;
  createdFromLead:   boolean;

  /** Primary service slug driving this project */
  primaryServiceSlug: string;
  /** All service slugs included (bundle has multiple) */
  serviceSlugs:      string[];
  /** Delivery types present — derived from services, drives completion gate */
  serviceDeliveryTypes: string[];

  /** For bundle sub-projects: reference to the billing anchor project */
  billingAnchorProjectId?: Types.ObjectId;
  /** True if this is the billing anchor of a bundle */
  isBundleAnchor:    boolean;
  /** Sub-project IDs (populated for bundle anchors only) */
  subProjectIds:     Types.ObjectId[];

  // ── Assignment ──────────────────────────────────────────────────────────────
  assignedEmployees:  IAssignedEmployee[];
  /** Quick ref to the primary manager — always mirrors the isPrimary entry above */
  primaryManagerId?:  Types.ObjectId;

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  projectStatus:    ProjectStatus;
  previousStatus?:  ProjectStatus;
  statusHistory:    IStatusHistoryEntry[];

  projectPriority:  ProjectPriority;

  startedAt?:       Date;
  completedAt?:     Date;
  deliveredAt?:     Date;
  archivedAt?:      Date;
  cancelledAt?:     Date;
  cancellationReason?: CancellationReason;
  cancellationNote?:   string;

  // ── Operational Dates ───────────────────────────────────────────────────────
  targetStartDate?:      Date;
  targetCompletionDate?: Date;
  expectedDeliveryDate?: Date;
  /** Updated on any meaningful activity (status change, note, doc upload) */
  lastActivityAt:        Date;
  /** Timestamp of last timeline entry — used in stalled detection */
  lastTimelineEntryAt?:  Date;

  // ── Workflow Flags ──────────────────────────────────────────────────────────
  isBlocked:           boolean;
  blockReason?:        string;
  isStalled:           boolean;
  lastStalledAt?:      Date;
  isOverdue:           boolean;
  lastOverdueFlaggedAt?: Date;
  requiresClientInput: boolean;
  requiresManualReview: boolean;

  // ── Delivery & Completion ───────────────────────────────────────────────────
  /** Structured checklist — gated per delivery type */
  completionChecklist: IChecklistItem[];
  /** 0–100 percentage, derived or manually set */
  progressPercentage:  number;

  // ── Notes & Tags ────────────────────────────────────────────────────────────
  internalNotes?: string;
  tags:           string[];

  // ── Audit ───────────────────────────────────────────────────────────────────
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;

  // ── Virtual helpers ─────────────────────────────────────────────────────────
  readonly isTerminal: boolean;
  readonly isActive: boolean;
  readonly daysSinceLastActivity: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProjectSchema = new Schema<IProject>(
  {
    // Identity
    projectCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    title:       { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 2000 },

    // Relationships
    clientId:        { type: Schema.Types.ObjectId, ref: 'ClientProfile', required: true, index: true },
    leadId:          { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    createdFromLead: { type: Boolean, default: false },

    primaryServiceSlug:  { type: String, required: true, trim: true, maxlength: 100 },
    serviceSlugs:        [{ type: String, trim: true, maxlength: 100 }],
    serviceDeliveryTypes:[{ type: String, trim: true, maxlength: 50 }],

    billingAnchorProjectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isBundleAnchor: { type: Boolean, default: false },
    subProjectIds:  [{ type: Schema.Types.ObjectId, ref: 'Project' }],

    // Assignment
    assignedEmployees: { type: [AssignedEmployeeSchema], default: [] },
    primaryManagerId:  { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // Lifecycle
    projectStatus: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.Draft,
      index: true,
    },
    previousStatus: { type: String, enum: Object.values(ProjectStatus) },
    statusHistory:  { type: [StatusHistorySchema], default: [] },

    projectPriority: {
      type: String,
      enum: Object.values(ProjectPriority),
      default: ProjectPriority.Medium,
      index: true,
    },

    startedAt:    { type: Date },
    completedAt:  { type: Date },
    deliveredAt:  { type: Date },
    archivedAt:   { type: Date },
    cancelledAt:  { type: Date },
    cancellationReason: { type: String, enum: Object.values(CancellationReason) },
    cancellationNote:   { type: String, maxlength: 1000 },

    // Operational Dates
    targetStartDate:      { type: Date, index: true },
    targetCompletionDate: { type: Date, index: true },
    expectedDeliveryDate: { type: Date, index: true },
    lastActivityAt:       { type: Date, default: () => new Date(), index: true },
    lastTimelineEntryAt:  { type: Date, index: true },

    // Workflow Flags
    isBlocked:            { type: Boolean, default: false, index: true },
    blockReason:          { type: String, maxlength: 500 },
    isStalled:            { type: Boolean, default: false, index: true },
    lastStalledAt:        { type: Date },
    isOverdue:            { type: Boolean, default: false, index: true },
    lastOverdueFlaggedAt: { type: Date },
    requiresClientInput:  { type: Boolean, default: false, index: true },
    requiresManualReview: { type: Boolean, default: false },

    // Delivery & Completion
    completionChecklist: { type: [ChecklistItemSchema], default: [] },
    progressPercentage:  { type: Number, default: 0, min: 0, max: 100 },

    // Notes & Tags
    internalNotes: { type: String, maxlength: 10000 },
    tags:          [{ type: String, trim: true, maxlength: 50 }],

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

ProjectSchema.virtual('isTerminal').get(function (this: IProject): boolean {
  return (
    this.projectStatus === ProjectStatus.Archived ||
    this.projectStatus === ProjectStatus.Cancelled
  );
});

ProjectSchema.virtual('isActive').get(function (this: IProject): boolean {
  return (
    this.projectStatus === ProjectStatus.Active ||
    this.projectStatus === ProjectStatus.Onboarding ||
    this.projectStatus === ProjectStatus.WaitingClient ||
    this.projectStatus === ProjectStatus.InReview
  );
});

ProjectSchema.virtual('daysSinceLastActivity').get(function (this: IProject): number {
  const ms = Date.now() - this.lastActivityAt.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
});

// ─── Compound Indexes (for CRM dashboard queries) ─────────────────────────────

// Admin project list: status + priority
ProjectSchema.index({ projectStatus: 1, projectPriority: -1 });

// Overdue query: isOverdue + status
ProjectSchema.index({ isOverdue: 1, projectStatus: 1 });

// Stalled query: isStalled + status
ProjectSchema.index({ isStalled: 1, projectStatus: 1 });

// Employee workbench: assigned employee userId + status
ProjectSchema.index({ 'assignedEmployees.userId': 1, projectStatus: 1 });

// Client portal: clientId + status
ProjectSchema.index({ clientId: 1, projectStatus: 1 });

// Delivery date tracking: expectedDeliveryDate + status
ProjectSchema.index({ expectedDeliveryDate: 1, projectStatus: 1 });

// ─── Pre-save Hook: Auto-generate project code ────────────────────────────────

ProjectSchema.pre('save', async function (next) {
  if (!this.isNew) {
    next();
    return;
  }

  try {
    // Find the highest existing code number to derive the next one
    const last = await ProjectModel.findOne(
      { projectCode: new RegExp(`^${PROJECT_CODE_PREFIX}-`) },
      { projectCode: 1 },
      { sort: { projectCode: -1 } }
    ).lean();

    let nextNum = 1;
    if (last?.projectCode) {
      const parts = last.projectCode.split('-');
      const num = parseInt(parts[1] ?? '0', 10);
      if (!isNaN(num)) nextNum = num + 1;
    }

    this.projectCode = `${PROJECT_CODE_PREFIX}-${String(nextNum).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ─── Model Export ─────────────────────────────────────────────────────────────

export const ProjectModel = model<IProject>('Project', ProjectSchema);
