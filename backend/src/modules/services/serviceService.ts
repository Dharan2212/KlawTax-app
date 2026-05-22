/**
 * Service Service (Business Logic)
 *
 * Orchestrates caching, repository access, and DTO mapping for the
 * services module. This is the only layer public routes should call.
 */

import { Types } from 'mongoose';
import { IService, ServicePublicDTO } from '../../models/service';
import {
  serviceRepository,
  ServiceListFilters,
  ServiceListOptions,
  PaginatedServices,
} from './serviceRepository';
import { cache, CACHE_TTL, cacheKey } from '../../utils/cache';
import { logger } from '../../utils/logger';

// ─── DTO Mapping ──────────────────────────────────────────────────────────────

/**
 * Maps a full service document (or lean object typed as IService)
 * to the public-safe DTO shape. Internal fields (seoDescription,
 * requiresApproval, requiresManualReview, etc.) are deliberately excluded.
 */
function toPublicDTO(service: IService): ServicePublicDTO {
  return {
    id: (service._id as Types.ObjectId).toString(),
    name: service.name,
    slug: service.slug,
    shortName: service.shortName,
    shortDescription: service.shortDescription,
    description: service.description,
    primaryCategory: service.primaryCategory,
    displayCategories: service.displayCategories,
    tags: service.tags,
    serviceDeliveryType: service.serviceDeliveryType,
    isBundle: service.isBundle,
    bundledServiceSlugs: service.bundledServiceSlugs,
    priceType: service.priceType,
    basePrice: service.basePrice,
    maxPrice: service.maxPrice,
    advancePrice: service.advancePrice,
    currency: service.currency,
    pricingNotes: service.pricingNotes,
    estimatedDeliveryDays: service.estimatedDeliveryDays,
    requiresDocuments: service.requiresDocuments,
    isFeatured: service.isFeatured,
    iconKey: service.iconKey,
    displayOrder: service.displayOrder,
  };
}

// ─── Result Shapes ────────────────────────────────────────────────────────────

export interface ServiceListResult {
  data: ServicePublicDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ServiceDetailResult {
  service: ServicePublicDTO;
  /** Sub-services resolved from bundledServiceSlugs (empty if not a bundle) */
  bundledServices: ServicePublicDTO[];
  /** Other services in the same display category */
  relatedServices: ServicePublicDTO[];
}

// ─── Service Layer ────────────────────────────────────────────────────────────

export const serviceService = {
  /**
   * List services with optional filtering, pagination, and 1-hour caching.
   * Cache key is derived from all filter + pagination parameters.
   */
  async listServices(
    filters: ServiceListFilters,
    options: ServiceListOptions
  ): Promise<ServiceListResult> {
    const paramStr = JSON.stringify({ ...filters, ...options });
    const key = cacheKey.serviceList(paramStr);

    return cache.getOrSet<ServiceListResult>(
      key,
      async (): Promise<ServiceListResult> => {
        const result: PaginatedServices = await serviceRepository.findAll(filters, options);
        return {
          data: result.data.map(toPublicDTO),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        };
      },
      CACHE_TTL.SERVICE_LIST
    );
  },

  /**
   * Get full service detail by slug, including resolved bundle sub-services
   * and related services in the same display category.
   * Returns null if the service does not exist or is inactive.
   */
  async getServiceBySlug(slug: string): Promise<ServiceDetailResult | null> {
    const key = cacheKey.serviceDetail(slug);

    return cache.getOrSet<ServiceDetailResult | null>(
      key,
      async (): Promise<ServiceDetailResult | null> => {
        const service = await serviceRepository.findBySlug(slug);
        if (!service) return null;

        // Resolve bundled sub-services
        let bundledServices: ServicePublicDTO[] = [];
        if (service.isBundle && service.bundledServiceSlugs.length > 0) {
          const subs = await serviceRepository.findBySlugs(service.bundledServiceSlugs);
          bundledServices = subs.map(toPublicDTO);
        }

        // Related services (same display category, excluding this service and bundles)
        const related = await serviceRepository.findRelated(
          service.displayCategories,
          slug,
          3
        );

        return {
          service: toPublicDTO(service),
          bundledServices,
          relatedServices: related.map(toPublicDTO),
        };
      },
      CACHE_TTL.SERVICE_DETAIL
    );
  },

  /**
   * Get featured services for homepage hero and featured sections.
   */
  async getFeaturedServices(): Promise<ServicePublicDTO[]> {
    const key = cacheKey.featuredServices();

    return cache.getOrSet<ServicePublicDTO[]>(
      key,
      async (): Promise<ServicePublicDTO[]> => {
        const services = await serviceRepository.findFeatured();
        return services.map(toPublicDTO);
      },
      CACHE_TTL.FEATURED_SERVICES
    );
  },

  /**
   * Invalidate all service-related cache entries.
   * Must be called after any admin mutation to the services collection.
   */
  async invalidateServiceCache(): Promise<void> {
    await cache.delByPrefix('services:');
    logger.info('[serviceService] Service cache invalidated');
  },
};
