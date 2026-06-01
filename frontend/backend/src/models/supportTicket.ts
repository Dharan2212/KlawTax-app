import { Schema, model, models, Document, Types, Model, CallbackWithoutResultAndOptionalError } from 'mongoose';
import {
  SupportTicketStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketResolutionType,
  SupportMessageSenderRole,
  SUPPORT_TICKET_TRANSITIONS,
} from './supportTicketEnums';

// ─── Sub-document Interface: Message ─────────────────────────────────────────

export interface ISupportMessage {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: SupportMessageSenderRole;
  message: string;
  attachments?: string[];
  visibleToClient: boolean;
  internalOnly: boolean;
  sentAt: Date;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ISupportTicket {
  ticketNumber: string;
  clientId: Types.ObjectId;
  assignedToId?: Types.ObjectId;
  relatedProjectId?: Types.ObjectId;
  relatedTaskId?: Types.ObjectId;
  relatedDocumentId?: Types.ObjectId;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  tags?: string[];
  ticketStatus: SupportTicketStatus;
  priority: SupportTicketPriority;
  resolutionType?: SupportTicketResolutionType;
  resolvedAt?: Date;
  closedAt?: Date;
  reopenedAt?: Date;
  escalationLevel: number;
  escalatedAt?: Date;
  firstResponseAt?: Date;
  lastResponseAt?: Date;
  slaDeadline?: Date;
  messages: ISupportMessage[];
  internalNotes?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicketMethods {
  canTransitionTo(newStatus: SupportTicketStatus): boolean;
}

export type ISupportTicketDocument = ISupportTicket & ISupportTicketMethods & Document;
export type ISupportTicketModel = Model<ISupportTicketDocument, Record<string, never>, ISupportTicketMethods>;

// ─── Sub-schema: Message ──────────────────────────────────────────────────────

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: Object.values(SupportMessageSenderRole), required: true },
    message: { type: String, required: true, maxlength: 5000, trim: true },
    attachments: { type: [String], default: [] },
    visibleToClient: { type: Boolean, default: true },
    internalOnly: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false }
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const supportTicketSchema = new Schema<ISupportTicketDocument, ISupportTicketModel, ISupportTicketMethods>(
  {
    ticketNumber:       { type: String, required: true, unique: true, trim: true, maxlength: 20 },
    clientId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToId:       { type: Schema.Types.ObjectId, ref: 'User' },
    relatedProjectId:   { type: Schema.Types.ObjectId, ref: 'Project' },
    relatedTaskId:      { type: Schema.Types.ObjectId, ref: 'Task' },
    relatedDocumentId:  { type: Schema.Types.ObjectId, ref: 'Document' },
    category:    { type: String, enum: Object.values(SupportTicketCategory), required: true },
    subject:     { type: String, required: true, maxlength: 300, trim: true },
    description: { type: String, required: true, maxlength: 5000, trim: true },
    tags:        { type: [String], default: [] },
    ticketStatus: { type: String, enum: Object.values(SupportTicketStatus), default: SupportTicketStatus.Open },
    priority:     { type: String, enum: Object.values(SupportTicketPriority), default: SupportTicketPriority.Medium },
    resolutionType: { type: String, enum: Object.values(SupportTicketResolutionType) },
    resolvedAt:  { type: Date },
    closedAt:    { type: Date },
    reopenedAt:  { type: Date },
    escalationLevel:  { type: Number, default: 0, min: 0, max: 2 },
    escalatedAt:      { type: Date },
    firstResponseAt:  { type: Date },
    lastResponseAt:   { type: Date },
    slaDeadline:      { type: Date },
    messages:     { type: [supportMessageSchema], default: [] },
    internalNotes: { type: String, maxlength: 5000 },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'supportTickets', versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

supportTicketSchema.index({ clientId: 1, ticketStatus: 1, createdAt: -1 });
supportTicketSchema.index({ ticketStatus: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ slaDeadline: 1, ticketStatus: 1 });
supportTicketSchema.index({ escalationLevel: 1, ticketStatus: 1 });
supportTicketSchema.index({ assignedToId: 1, ticketStatus: 1 });
supportTicketSchema.index({ relatedProjectId: 1, createdAt: -1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────

supportTicketSchema.methods.canTransitionTo = function (
  newStatus: SupportTicketStatus
): boolean {
  const transitions = SUPPORT_TICKET_TRANSITIONS as Record<string, SupportTicketStatus[]>;
  const allowed: SupportTicketStatus[] = transitions[this.ticketStatus as string] ?? [];
  return allowed.includes(newStatus);
};

// ─── Pre-save hook ────────────────────────────────────────────────────────────

const preSaveHook: (
  this: ISupportTicketDocument,
  next: CallbackWithoutResultAndOptionalError
) => void = function (next) {
  if (this.isModified('ticketStatus')) {
    const now = new Date();
    if (this.ticketStatus === SupportTicketStatus.Resolved && !this.resolvedAt) {
      this.resolvedAt = now;
    }
    if (this.ticketStatus === SupportTicketStatus.Closed && !this.closedAt) {
      this.closedAt = now;
    }
    if (this.ticketStatus === SupportTicketStatus.Reopened) {
      this.reopenedAt = now;
    }
  }
  next();
};

supportTicketSchema.pre('save', preSaveHook);

// ─── Model ────────────────────────────────────────────────────────────────────

export const SupportTicket: ISupportTicketModel =
  (models['SupportTicket'] as ISupportTicketModel | undefined) ??
  model<ISupportTicketDocument, ISupportTicketModel>('SupportTicket', supportTicketSchema);

export { SUPPORT_TICKET_TRANSITIONS };
