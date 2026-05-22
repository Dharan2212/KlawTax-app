import { Schema, model, Document, Types } from 'mongoose';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  OrganisationType,
  PreferredContactMethod,
  UrgencyLevel,
  LeadArchiveReason,
  LeadLossReason,
} from './leadEnums';

// ─── Lead Document Interface ──────────────────────────────────────────────────

export interface ILead extends Document {
  // Identity
  fullName: string;
  email?: string;
  phone: string;

  // Source metadata
  leadSource: LeadSource;
  campaignSource?: string;
  referralSource?: string;
  landingPage?: string;
  serviceInterestSlugs: string[];

  // Organisation metadata
  organisationName?: string;
  organisationType?: OrganisationType;
  gstNumber?: string;
  existingRegistrationInfo?: string;

  // Lifecycle
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: Types.ObjectId;       // Ref: users (employee)
  assignedAt?: Date;
  convertedAt?: Date;
  convertedClientId?: Types.ObjectId; // Ref: clientProfiles — set on conversion
  archivedAt?: Date;
  archiveReason?: LeadArchiveReason;
  lossReason?: LeadLossReason;
  lossNote?: string;

  // Communication tracking
  preferredContactMethod: PreferredContactMethod;
  followUpDate?: Date;
  lastContactedAt?: Date;
  contactAttemptCount: number;

  // Qualification
  estimatedBudget?: number;
  urgencyLevel?: UrgencyLevel;
  qualificationScore?: number;         // 0–100, computed by admin or future automation

  // Notes and tags
  notes?: string;                      // Public-facing inquiry note from the lead
  internalNotes?: string;              // CRM-only internal notes (admin/employee)
  tags: string[];

  // System metadata
  createdBySystem: boolean;           // true = public form; false = manually created by admin
  ipAddress?: string;                 // Captured from public form submission

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── Lead Schema ──────────────────────────────────────────────────────────────

const LeadSchema = new Schema<ILead>(
  {
    // Identity
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,          // Allows null/undefined while keeping unique index
      default: undefined,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    // Source metadata
    leadSource: {
      type: String,
      enum: Object.values(LeadSource),
      default: LeadSource.Website,
    },
    campaignSource: { type: String, trim: true, maxlength: 100 },
    referralSource: { type: String, trim: true, maxlength: 100 },
    landingPage: { type: String, trim: true, maxlength: 500 },
    serviceInterestSlugs: {
      type: [String],
      default: [],
    },

    // Organisation metadata
    organisationName: { type: String, trim: true, maxlength: 200 },
    organisationType: {
      type: String,
      enum: Object.values(OrganisationType),
    },
    gstNumber: { type: String, trim: true, maxlength: 20 },
    existingRegistrationInfo: { type: String, trim: true, maxlength: 500 },

    // Lifecycle
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.New,
    },
    priority: {
      type: String,
      enum: Object.values(LeadPriority),
      default: LeadPriority.Medium,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    assignedAt: { type: Date },
    convertedAt: { type: Date },
    convertedClientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientProfile',
      default: undefined,
    },
    archivedAt: { type: Date },
    archiveReason: {
      type: String,
      enum: Object.values(LeadArchiveReason),
    },
    lossReason: {
      type: String,
      enum: Object.values(LeadLossReason),
    },
    lossNote: { type: String, trim: true, maxlength: 500 },

    // Communication tracking
    preferredContactMethod: {
      type: String,
      enum: Object.values(PreferredContactMethod),
      default: PreferredContactMethod.Any,
    },
    followUpDate: { type: Date },
    lastContactedAt: { type: Date },
    contactAttemptCount: { type: Number, default: 0, min: 0 },

    // Qualification
    estimatedBudget: { type: Number, min: 0 },
    urgencyLevel: {
      type: String,
      enum: Object.values(UrgencyLevel),
    },
    qualificationScore: { type: Number, min: 0, max: 100 },

    // Notes and tags
    notes: { type: String, trim: true, maxlength: 2000 },
    internalNotes: { type: String, trim: true, maxlength: 5000 },
    tags: { type: [String], default: [] },

    // System metadata
    createdBySystem: { type: Boolean, default: false },
    ipAddress: { type: String, trim: true, maxlength: 45 },
  },
  {
    timestamps: true,
    collection: 'leads',
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Status-based filtering (most common CRM query)
LeadSchema.index({ status: 1, createdAt: -1 });

// Assignment queries
LeadSchema.index({ assignedTo: 1, status: 1 });

// Follow-up scheduler queries
LeadSchema.index({ followUpDate: 1, status: 1 });

// Email lookup (sparse — may be missing)
LeadSchema.index({ email: 1 }, { sparse: true });

// Phone lookup
LeadSchema.index({ phone: 1 });

// Source tracking / analytics
LeadSchema.index({ leadSource: 1, createdAt: -1 });

// Conversion queries
LeadSchema.index({ convertedClientId: 1 }, { sparse: true });

// Auto-archival job queries — inactive leads detection
LeadSchema.index({ updatedAt: 1, status: 1 });

// Priority filtering
LeadSchema.index({ priority: 1, status: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

export const Lead = model<ILead>('Lead', LeadSchema);
