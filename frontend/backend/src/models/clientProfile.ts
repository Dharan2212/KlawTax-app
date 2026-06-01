import { Schema, model, models, Document, Types, Model } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ClientCategory {
  Individual  = 'individual',
  NGO         = 'ngo',
  Business    = 'business',
  Government  = 'government',
  Educational = 'educational',
}

export enum OnboardingStatus {
  Registered     = 'registered',    // Account created, no payment yet
  PaymentPending = 'payment_pending',
  Onboarded      = 'onboarded',     // Payment confirmed, project(s) active
  Active         = 'active',        // At least one active project
  Completed      = 'completed',     // All projects delivered
  Churned        = 'churned',       // No activity, treated as inactive
}

export enum CommunicationPreference {
  WhatsApp = 'whatsapp',
  Email    = 'email',
  Phone    = 'phone',
  Any      = 'any',
}

// ─── Sub-schemas (embedded objects) ──────────────────────────────────────────

interface IAddress {
  line1?:    string;
  line2?:    string;
  city?:     string;
  state?:    string;
  pincode?:  string;
  country:   string;
}

interface INgoDetails {
  /** Legal registration name of the NGO. */
  registeredName?:     string;
  /** Section 8 / Trust / Society etc. */
  organizationType?:   string;
  /** CIN or registration number */
  registrationNumber?: string;
  /** PAN of the NGO entity. */
  pan?:                string;
  /** GST number if applicable. */
  gst?:                string;
  /** DARPAN unique ID once registered. */
  darpanId?:           string;
  /** 12A certificate number once issued. */
  reg12ANumber?:       string;
  /** 80G certificate number once issued. */
  reg80GNumber?:       string;
}

interface IBillingInfo {
  /** GST number for invoice purposes. */
  gstNumber?: string;
  /** Legal name to appear on invoices. */
  billingName?: string;
  billingAddress?: IAddress;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IClientProfile {
  /** One-to-one link to the `users` collection. */
  userId: Types.ObjectId;

  category: ClientCategory;

  onboardingStatus: OnboardingStatus;

  // ── Organization / Contact ─────────────────────────────────────────────────
  organizationName?: string;

  /** Primary contact person (may differ from the login user). */
  contactPersonName?: string;

  contactPhone?: string;

  contactEmail?: string;

  communicationPreference: CommunicationPreference;

  address?: IAddress;

  // ── NGO / Business Metadata ────────────────────────────────────────────────
  ngoDetails?: INgoDetails;

  // ── Billing ────────────────────────────────────────────────────────────────
  billingInfo?: IBillingInfo;

  // ── CRM Metadata ──────────────────────────────────────────────────────────
  /** Source of acquisition (e.g. 'google', 'referral', 'whatsapp'). */
  acquisitionSource?: string;

  /** Internal CRM notes visible only to admin. */
  internalNotes?: string;

  /** Assigned account manager (employee). */
  assignedManagerId?: Types.ObjectId;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onboardedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type IClientProfileDocument = IClientProfile & Document;
export type IClientProfileModel = Model<IClientProfileDocument>;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const addressSchema = new Schema<IAddress>(
  {
    line1:   { type: String, maxlength: 200 },
    line2:   { type: String, maxlength: 200 },
    city:    { type: String, maxlength: 100 },
    state:   { type: String, maxlength: 100 },
    pincode: { type: String, maxlength: 10 },
    country: { type: String, maxlength: 100, default: 'India' },
  },
  { _id: false }
);

const ngoDetailsSchema = new Schema<INgoDetails>(
  {
    registeredName:     { type: String, maxlength: 300 },
    organizationType:   { type: String, maxlength: 100 },
    registrationNumber: { type: String, maxlength: 100 },
    pan:                { type: String, maxlength: 10 },
    gst:                { type: String, maxlength: 15 },
    darpanId:           { type: String, maxlength: 50 },
    reg12ANumber:       { type: String, maxlength: 100 },
    reg80GNumber:       { type: String, maxlength: 100 },
  },
  { _id: false }
);

const billingInfoSchema = new Schema<IBillingInfo>(
  {
    gstNumber:      { type: String, maxlength: 15 },
    billingName:    { type: String, maxlength: 300 },
    billingAddress: { type: addressSchema },
  },
  { _id: false }
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientProfileSchema = new Schema<IClientProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
      index: true,
    },

    category: {
      type: String,
      enum: Object.values(ClientCategory),
      default: ClientCategory.Individual,
      index: true,
    },

    onboardingStatus: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.Registered,
      index: true,
    },

    organizationName: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    contactPersonName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },

    communicationPreference: {
      type: String,
      enum: Object.values(CommunicationPreference),
      default: CommunicationPreference.WhatsApp,
    },

    address: {
      type: addressSchema,
    },

    ngoDetails: {
      type: ngoDetailsSchema,
    },

    billingInfo: {
      type: billingInfoSchema,
    },

    acquisitionSource: {
      type: String,
      maxlength: 100,
    },

    internalNotes: {
      type: String,
      maxlength: 2000,
    },

    assignedManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    onboardedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'clientProfiles',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin CRM listing: clients by category and onboarding status
clientProfileSchema.index({ category: 1, onboardingStatus: 1 });

// Assigned manager view
clientProfileSchema.index({ assignedManagerId: 1, onboardingStatus: 1 });

// NGO-specific lookups (registration numbers)
clientProfileSchema.index({ 'ngoDetails.pan': 1 }, { sparse: true });
clientProfileSchema.index({ 'ngoDetails.darpanId': 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────

export const ClientProfile: IClientProfileModel =
  (models['ClientProfile'] as IClientProfileModel | undefined) ??
  model<IClientProfileDocument>('ClientProfile', clientProfileSchema);
