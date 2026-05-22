import { Schema, model, Document as MongoDoc, Types } from 'mongoose';
import {
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
  StorageProvider,
} from './documentEnums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IDocument extends MongoDoc {
  // Identity
  title:             string;
  description?:      string;

  // Relationships
  projectId?:        Types.ObjectId;
  taskId?:           Types.ObjectId;
  uploadedBy:        Types.ObjectId;      // users._id
  clientId?:         Types.ObjectId;      // clientProfiles._id — for scoping
  approvalId?:       Types.ObjectId;      // linked approval record

  // Storage metadata
  fileName:          string;              // sanitised, stored name
  originalFileName:  string;              // name as uploaded by user
  mimeType:          string;
  extension:         string;
  fileSizeBytes:     number;
  storageKey:        string;              // S3 key or local path
  storageProvider:   StorageProvider;

  // Categorisation
  documentCategory:  DocumentCategory;
  tags:              string[];

  // Versioning
  versionNumber:     number;             // starts at 1
  previousVersionId?: Types.ObjectId;   // ref: documents
  parentDocumentId?: Types.ObjectId;    // root of the version chain
  isLatestVersion:   boolean;

  // Lifecycle
  documentStatus:    DocumentStatus;
  uploadedAt:        Date;
  approvedAt?:       Date;
  rejectedAt?:       Date;
  archivedAt?:       Date;

  // Workflow flags
  requiresApproval:   boolean;
  requiresResubmission: boolean;
  visibility:         DocumentVisibility;
  sensitiveDelivery:  boolean;           // shorter pre-signed URL TTL

  // Review metadata
  currentReviewerId?: Types.ObjectId;   // users._id of reviewer
  reviewNotes?:       string;
  rejectionReason?:   string;
  revisionInstructions?: string;

  // Soft delete
  isDeleted:          boolean;
  deletedAt?:         Date;
  deletedBy?:         Types.ObjectId;

  // Audit
  createdBy:          Types.ObjectId;
  updatedBy?:         Types.ObjectId;
  createdAt:          Date;
  updatedAt:          Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const documentSchema = new Schema<IDocument>(
  {
    // Identity
    title:            { type: String, required: true, trim: true, maxlength: 255 },
    description:      { type: String, trim: true, maxlength: 1000 },

    // Relationships
    projectId:        { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    taskId:           { type: Schema.Types.ObjectId, ref: 'Task',    index: true },
    uploadedBy:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId:         { type: Schema.Types.ObjectId, ref: 'ClientProfile', index: true },
    approvalId:       { type: Schema.Types.ObjectId, ref: 'Approval' },

    // Storage
    fileName:         { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    mimeType:         { type: String, required: true },
    extension:        { type: String, required: true, lowercase: true },
    fileSizeBytes:    { type: Number, required: true, min: 0 },
    storageKey:       { type: String, required: true },
    storageProvider:  {
      type:    String,
      enum:    Object.values(StorageProvider),
      default: StorageProvider.S3,
    },

    // Categorisation
    documentCategory: {
      type:     String,
      enum:     Object.values(DocumentCategory),
      required: true,
      index:    true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],

    // Versioning
    versionNumber:    { type: Number, required: true, default: 1, min: 1 },
    previousVersionId:{ type: Schema.Types.ObjectId, ref: 'Document' },
    parentDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', index: true },
    isLatestVersion:  { type: Boolean, required: true, default: true, index: true },

    // Lifecycle
    documentStatus: {
      type:     String,
      enum:     Object.values(DocumentStatus),
      required: true,
      default:  DocumentStatus.Uploaded,
      index:    true,
    },
    uploadedAt:     { type: Date, required: true, default: Date.now },
    approvedAt:     { type: Date },
    rejectedAt:     { type: Date },
    archivedAt:     { type: Date },

    // Workflow flags
    requiresApproval:      { type: Boolean, default: true },
    requiresResubmission:  { type: Boolean, default: false },
    visibility: {
      type:    String,
      enum:    Object.values(DocumentVisibility),
      default: DocumentVisibility.EmployeeOnly,
      index:   true,
    },
    sensitiveDelivery: { type: Boolean, default: false },

    // Review metadata
    currentReviewerId:    { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes:          { type: String, maxlength: 2000 },
    rejectionReason:      { type: String, maxlength: 2000 },
    revisionInstructions: { type: String, maxlength: 2000 },

    // Soft delete
    isDeleted:  { type: Boolean, default: false, index: true },
    deletedAt:  { type: Date },
    deletedBy:  { type: Schema.Types.ObjectId, ref: 'User' },

    // Audit
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps:      true,
    collection:      'documents',
    versionKey:      false,
    optimisticConcurrency: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Approval queue / review filtering
documentSchema.index({ documentStatus: 1, requiresApproval: 1 });
// Client portal: own docs, visible only
documentSchema.index({ clientId: 1, visibility: 1, isLatestVersion: 1 });
// Project document feed
documentSchema.index({ projectId: 1, isLatestVersion: 1, documentStatus: 1 });
// Version chain traversal
documentSchema.index({ parentDocumentId: 1, versionNumber: 1 });
// Reviewer workload
documentSchema.index({ currentReviewerId: 1, documentStatus: 1 });
// Soft-delete exclusion
documentSchema.index({ isDeleted: 1, documentStatus: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

documentSchema.virtual('isClientVisible').get(function (this: IDocument) {
  return this.visibility === DocumentVisibility.ClientVisible;
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const DocumentModel = model<IDocument>('Document', documentSchema);
