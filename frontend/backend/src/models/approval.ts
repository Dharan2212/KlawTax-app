import { Schema, model, Document as MongoDoc, Types } from 'mongoose';
import { ApprovalStatus, ApprovalType, ReviewPriority } from './documentEnums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IApproval extends MongoDoc {
  // Relationships
  projectId?:   Types.ObjectId;   // ref: Project  — set for Batch 3.1 integration
  taskId?:      Types.ObjectId;   // ref: Task     — set for Batch 3.2 integration
  documentId?:  Types.ObjectId;   // ref: Document — primary document under review
  requestedBy:  Types.ObjectId;   // ref: User (employee who submitted)
  reviewerId?:  Types.ObjectId;   // ref: User (admin assigned to review)

  // Metadata
  approvalType:   ApprovalType;
  approvalStatus: ApprovalStatus;
  reviewPriority: ReviewPriority;

  // Submission context
  submissionNote?: string;        // note from the employee on submission
  resubmissionCount: number;      // how many times this has been resubmitted

  // Review lifecycle timestamps
  submittedAt:           Date;
  reviewStartedAt?:      Date;
  reviewedAt?:           Date;
  approvedAt?:           Date;
  rejectedAt?:           Date;
  revisionRequestedAt?:  Date;
  resubmittedAt?:        Date;

  // Decision metadata
  reviewNotes?:           string;
  rejectionReason?:       string;
  revisionInstructions?:  string;

  // Workflow flags
  requiresResubmission: boolean;
  finalDecision:        boolean;   // true once approved/rejected with no further action
  visibleToClient:      boolean;

  // Versioning links
  currentVersionId?:  Types.ObjectId;  // ref: Document (current version being reviewed)
  approvedVersionId?: Types.ObjectId;  // ref: Document (the version that was approved)

  // Resubmission history — lightweight list of previous version IDs
  versionHistory: Types.ObjectId[];

  // Soft delete
  isDeleted:  boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;

  // Audit
  createdBy:  Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt:  Date;
  updatedAt:  Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const approvalSchema = new Schema<IApproval>(
  {
    // Relationships
    projectId:   { type: Schema.Types.ObjectId, ref: 'Project',       index: true },
    taskId:      { type: Schema.Types.ObjectId, ref: 'Task',          index: true },
    documentId:  { type: Schema.Types.ObjectId, ref: 'Document',      index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewerId:  { type: Schema.Types.ObjectId, ref: 'User',          index: true },

    // Metadata
    approvalType: {
      type:     String,
      enum:     Object.values(ApprovalType),
      required: true,
      index:    true,
    },
    approvalStatus: {
      type:     String,
      enum:     Object.values(ApprovalStatus),
      required: true,
      default:  ApprovalStatus.Pending,
      index:    true,
    },
    reviewPriority: {
      type:    String,
      enum:    Object.values(ReviewPriority),
      default: ReviewPriority.Medium,
      index:   true,
    },

    // Submission
    submissionNote:    { type: String, maxlength: 2000 },
    resubmissionCount: { type: Number, default: 0, min: 0 },

    // Timestamps
    submittedAt:          { type: Date, required: true, default: Date.now },
    reviewStartedAt:      { type: Date },
    reviewedAt:           { type: Date },
    approvedAt:           { type: Date },
    rejectedAt:           { type: Date },
    revisionRequestedAt:  { type: Date },
    resubmittedAt:        { type: Date },

    // Decision
    reviewNotes:          { type: String, maxlength: 2000 },
    rejectionReason:      { type: String, maxlength: 2000 },
    revisionInstructions: { type: String, maxlength: 2000 },

    // Flags
    requiresResubmission: { type: Boolean, default: false },
    finalDecision:        { type: Boolean, default: false },
    visibleToClient:      { type: Boolean, default: false },

    // Versioning
    currentVersionId:  { type: Schema.Types.ObjectId, ref: 'Document' },
    approvedVersionId: { type: Schema.Types.ObjectId, ref: 'Document' },
    versionHistory:    [{ type: Schema.Types.ObjectId, ref: 'Document' }],

    // Soft delete
    isDeleted:  { type: Boolean, default: false, index: true },
    deletedAt:  { type: Date },
    deletedBy:  { type: Schema.Types.ObjectId, ref: 'User' },

    // Audit
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps:  true,
    collection:  'approvals',
    versionKey:  false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Approval queue — pending reviews ordered by priority
approvalSchema.index({ approvalStatus: 1, reviewPriority: -1, submittedAt: 1 });
// Reviewer workload
approvalSchema.index({ reviewerId: 1, approvalStatus: 1 });
// Project approval history
approvalSchema.index({ projectId: 1, approvalStatus: 1, submittedAt: -1 });
// Overdue detection — pending/under_review older than threshold
approvalSchema.index({ approvalStatus: 1, submittedAt: 1 });
// Employee submission history
approvalSchema.index({ requestedBy: 1, approvalStatus: 1 });
// Guard: resubmission count warning query
approvalSchema.index({ resubmissionCount: 1, approvalStatus: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const ApprovalModel = model<IApproval>('Approval', approvalSchema);
