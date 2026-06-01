/**
 * Service Repository
 * Data-access layer — all Mongoose queries for the services collection.
 * Business logic lives in serviceService.ts.
 */

import { FilterQuery, SortOrder } from 'mongoose';
import { Service, IService } from '../../models/service';
import {
  ServiceDisplayCategory,
  ServiceDeliveryType,
} from '../../models/serviceEnums';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ServiceListFilters {
  displayCategory?: ServiceDisplayCategory;
  deliveryType?: ServiceDeliveryType;
  featured?: boolean;
  isBundle?: boolean;
  search?: string;
  /** Admin-only flag — defaults to false (public queries only see active+public) */
  includeInactive?: boolean;
}

export interface ServiceListOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedServices {
  data: IService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function buildFilter(filters: ServiceListFilters): FilterQuery<IService> {
  const query: FilterQuery<IService> = {};

  if (!filters.includeInactive) {
    query.isActive = true;
    query.isPublic = true;
  }

  if (filters.displayCategory !== undefined) {
    // displayCategories is an array field — match services that include this category
    query.displayCategories = { $in: [filters.displayCategory] };
  }

  if (filters.deliveryType !== undefined) {
    query.serviceDeliveryType = filters.deliveryType;
  }

  if (filters.featured !== undefined) {
    query.isFeatured = filters.featured;
  }

  if (filters.isBundle !== undefined) {
    query.isBundle = filters.isBundle;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  return query;
}

function buildSort(
  options: ServiceListOptions,
  hasTextSearch: boolean
): Record<string, SortOrder | { $meta: string }> {
  const sortDir: SortOrder = options.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, SortOrder | { $meta: string }> = {};

  // Text-search relevance score takes priority so results are actually relevant
  if (hasTextSearch) {
    sort['score'] = { $meta: 'textScore' };
  }

  sort[options.sortBy] = sortDir;
  return sort;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const serviceRepository = {
  /**
   * Paginated list of services matching filters.
   * Returns lean (plain JS) objects typed as IService.
   */
  async findAll(
    filters: ServiceListFilters,
    options: ServiceListOptions
  ): Promise<PaginatedServices> {
    const filter = buildFilter(filters);
    const skip = (options.page - 1) * options.limit;
    const sort = buildSort(options, Boolean(filters.search));

    const [data, total] = await Promise.all([
      Service.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.limit)
        .lean<IService[]>(),
      Service.countDocuments(filter),
    ]);

    return {
      data: data as IService[],
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  },

  /**
   * Find a single active public service by slug.
   */
  async findBySlug(
    slug: string,
    includeInactive = false
  ): Promise<IService | null> {
    const filter: FilterQuery<IService> = { slug };
    if (!includeInactive) {
      filter.isActive = true;
      filter.isPublic = true;
    }
    const doc = await Service.findOne(filter).lean<IService>();
    return doc as IService | null;
  },

  /**
   * Find all featured services ordered by displayOrder.
   * Used for the homepage hero card and featured sections.
   */
  async findFeatured(): Promise<IService[]> {
    const docs = await Service.find({ isActive: true, isPublic: true, isFeatured: true }).limit(20)
      .sort({ displayOrder: 1 })
      .lean<IService[]>();
    return docs as IService[];
  },

  /**
   * Find active public services matching a list of slugs.
   * Used to resolve bundle sub-services for display.
   */
  async findBySlugs(slugs: string[]): Promise<IService[]> {
    const docs = await Service.find({
      slug: { $in: slugs },
      isActive: true,
      isPublic: true,
    })
      .sort({ displayOrder: 1 })
      .lean<IService[]>();
    return docs as IService[];
  },

  /**
   * Find all bundle services.
   * Reserved for admin catalog and future checkout workflows.
   */
  async findBundles(): Promise<IService[]> {
    const docs = await Service.find({ isBundle: true, isActive: true, isPublic: true }).limit(10)
      .sort({ displayOrder: 1 })
      .lean<IService[]>();
    return docs as IService[];
  },

  /**
   * Find services in the same display categories, excluding the current service.
   * Used for the "Related services" section on service detail pages.
   */
  async findRelated(
    displayCategories: ServiceDisplayCategory[],
    excludeSlug: string,
    limit = 3
  ): Promise<IService[]> {
    const docs = await Service.find({
      displayCategories: { $in: displayCategories },
      slug: { $ne: excludeSlug },
      isActive: true,
      isPublic: true,
      isBundle: false,
    })
      .sort({ popularityScore: -1, displayOrder: 1 })
      .limit(limit)
      .lean<IService[]>();
    return docs as IService[];
  },

  /**
   * Lightweight existence check by slug.
   * Used for validation in admin operations.
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const count = await Service.countDocuments({ slug });
    return count > 0;
  },

  /**
   * Admin variant of findAll — includes inactive and non-public records.
   */
  async findAllAdmin(
    filters: ServiceListFilters,
    options: ServiceListOptions
  ): Promise<PaginatedServices> {
    return serviceRepository.findAll({ ...filters, includeInactive: true }, options);
  },
};
