/**
 * Service Model
 *
 * Represents a single canonical service record in the KlawTax catalog.
 *
 * Architecture notes (v1.5 Part 10):
 *   - 26 canonical records total
 *   - Cross-category display is handled via displayCategories[] — ONE record
 *     per service, multiple frontend tabs. Never duplicate documents.
 *   - Bundle services (isBundle: true) reference sub-services by slug.
 *   - DIN and DSC records are seeded as isActive: false (unbundled not yet sold).
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ServicePrimaryCategory,
  ServiceDisplayCategory,
  ServiceDeliveryType,
  ServicePriceType,
} from './serviceEnums';

// ─── Document Interface ───────────────────────────────────────────────────────

export interface IService extends Document {
  _id: Types.ObjectId;

  // Identity
  name: string;
  slug: string;
  shortName: string;
  description: string;
  shortDescription: string;

  // Category Structure
  primaryCategory: ServicePrimaryCategory;
  /** Frontend display-category tabs this service appears under */
  displayCategories: ServiceDisplayCategory[];
  tags: string[];

  // Service Logic
  serviceDeliveryType: ServiceDeliveryType;
  /** True if this record is a bundle that groups multiple services */
  isBundle: boolean;
  /** Slugs of services included in this bundle (empty if not a bundle) */
  bundledServiceSlugs: string[];
  /** Slug of the bundle this service belongs to, if any */
  parentServiceSlug: string | null;

  // Pricing
  priceType: ServicePriceType;
  /** For range pricing: the minimum / starting price */
  basePrice: number;
  /** For range pricing: the maximum price (null for fixed / custom) */
  maxPrice: number | null;
  /** 50% advance payment amount (null if not applicable) */
  advancePrice: number | null;
  currency: string;
  pricingNotes: string;

  // Delivery Metadata
  estimatedDeliveryDays: number | null;
  requiresDocuments: boolean;
  requiresApproval: boolean;
  requiresManualReview: boolean;

  // Visibility
  isActive: boolean;
  isFeatured: boolean;
  isPublic: boolean;

  // SEO / Admin Metadata (not surfaced in public DTO)
  seoTitle: string;
  seoDescription: string;
  iconKey: string;

  // Display
  displayOrder: number;
  popularityScore: number;

  // Lifecycle
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Public-Safe DTO ─────────────────────────────────────────────────────────
// This is the shape returned to the public API. Internal fields
// (requiresApproval, requiresManualReview, seoTitle, seoDescription,
// isActive, isPublic, archivedAt, createdAt, updatedAt) are excluded.

export interface ServicePublicDTO {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  shortDescription: string;
  description: string;
  primaryCategory: ServicePrimaryCategory;
  displayCategories: ServiceDisplayCategory[];
  tags: string[];
  serviceDeliveryType: ServiceDeliveryType;
  isBundle: boolean;
  bundledServiceSlugs: string[];
  priceType: ServicePriceType;
  basePrice: number;
  maxPrice: number | null;
  advancePrice: number | null;
  currency: string;
  pricingNotes: string;
  estimatedDeliveryDays: number | null;
  requiresDocuments: boolean;
  isFeatured: boolean;
  iconKey: string;
  displayOrder: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const serviceSchema = new Schema<IService>(
  {
    name:             { type: String, required: true, trim: true },
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortName:        { type: String, required: true, trim: true },
    description:      { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 300 },

    primaryCategory: {
      type: String,
      enum: Object.values(ServicePrimaryCategory),
      required: true,
      index: true,
    },
    displayCategories: {
      type: [String],
      enum: Object.values(ServiceDisplayCategory),
      default: [],
    },
    tags: { type: [String], default: [] },

    serviceDeliveryType: {
      type: String,
      enum: Object.values(ServiceDeliveryType),
      required: true,
    },
    isBundle:            { type: Boolean, default: false },
    bundledServiceSlugs: { type: [String], default: [] },
    parentServiceSlug:   { type: String, default: null },

    priceType: {
      type: String,
      enum: Object.values(ServicePriceType),
      required: true,
    },
    basePrice:    { type: Number, required: true, min: 0 },
    maxPrice:     { type: Number, default: null },
    advancePrice: { type: Number, default: null },
    currency:     { type: String, default: 'INR', uppercase: true, trim: true },
    pricingNotes: { type: String, default: '' },

    estimatedDeliveryDays: { type: Number, default: null },
    requiresDocuments:     { type: Boolean, default: true },
    requiresApproval:      { type: Boolean, default: true },
    requiresManualReview:  { type: Boolean, default: true },

    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isPublic:   { type: Boolean, default: true },

    seoTitle:       { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    iconKey:        { type: String, default: 'default' },

    displayOrder:   { type: Number, default: 100 },
    popularityScore: { type: Number, default: 0 },

    archivedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        // Expose string id, remove BSON _id
        ret['id'] = (ret['_id'] as Types.ObjectId).toString();
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (ret as Record<string, unknown>)['_id'];
        return ret;
      },
    },
    toObject: { virtuals: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// slug has a unique index declared inline above.
// Additional compound indexes below optimise the most frequent query patterns.

/** Primary public catalog query: active + public records ordered for display */
serviceSchema.index({ isActive: 1, isPublic: 1, displayOrder: 1 });

/** Featured services query (hero card, homepage sections) */
serviceSchema.index({ isActive: 1, isPublic: 1, isFeatured: 1, displayOrder: 1 });

/** Category tab filtering — the core frontend navigation query */
serviceSchema.index({ displayCategories: 1, isActive: 1, displayOrder: 1 });

/** Bundle lookup */
serviceSchema.index({ isBundle: 1, isActive: 1 });

/** Full-text search across name, shortDescription, and tags */
serviceSchema.index(
  { name: 'text', shortDescription: 'text', tags: 'text' },
  {
    name: 'service_text_search',
    weights: { name: 10, shortDescription: 5, tags: 3 },
  }
);

// ─── Model ────────────────────────────────────────────────────────────────────

export const Service: Model<IService> = mongoose.model<IService>('Service', serviceSchema);
