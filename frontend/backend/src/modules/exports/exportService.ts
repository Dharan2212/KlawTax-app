import { Types } from 'mongoose';
import { ExportJob, IExportJobDocument } from '../../models/exportJob';
import { ExportJobStatus, ExportJobType, ExportRequestorRole } from '../../models/enums';
import { NotificationService } from '../notifications/notificationService';
import { NotificationType, NotificationCategory, NotificationPriority } from '../../models/notificationEnums';
import { AuditService } from '../audit/auditService';
import { AuditCategory, AuditSource, AuditAction } from '../../models/auditLogEnums';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface CreateExportDTO {
  exportType: ExportJobType;
  entityType?: string;
  entityId?: string;
  filters?: Record<string, unknown>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const EXPORT_EXPIRY_DAYS = 7;

export class ExportService {
  /**
   * Request a new export job.
   * In a real system this queues a BullMQ job.
   * Here we create the DB record and simulate the async queue.
   */
  static async requestExport(
    dto: CreateExportDTO,
    requestorId: string,
    requestorRole: string
  ): Promise<IExportJobDocument> {
    const role =
      requestorRole === 'admin' ? ExportRequestorRole.Admin : ExportRequestorRole.Client;

    const job = await ExportJob.create({
      requestedById: new Types.ObjectId(requestorId),
      requestedByRole: role,
      exportType: dto.exportType,
      entityType: dto.entityType,
      entityId: dto.entityId ? new Types.ObjectId(dto.entityId) : undefined,
      filterSnapshot: dto.filters,
      status: ExportJobStatus.Queued,
      retryCount: 0,
      queuedAt: new Date(),
    });

    await AuditService.log({
      actorUserId: requestorId,
      actorRole: requestorRole,
      entityType: 'export_job',
      entityId: job._id as Types.ObjectId,
      action: AuditAction.ExportRequested,
      category: AuditCategory.Export,
      source: AuditSource.Api,
      metadata: { exportType: dto.exportType, entityType: dto.entityType },
    });

    logger.info('[ExportService] Export job queued', {
      jobId: job._id,
      exportType: dto.exportType,
      requestorId,
    });

    // Phase 5 (async workers): enqueue the export job for background processing.
    // await exportQueue.add('process-export', { jobId: job._id });

    return job;
  }

  /**
   * Get a single export job by ID.
   * Enforces ownership: clients can only access their own jobs.
   */
  static async getJobById(
    jobId: string,
    requestorId: string,
    requestorRole: string
  ): Promise<IExportJobDocument> {
    const job = await ExportJob.findById(jobId);

    if (!job) throw new AppError('Export job not found', 404);

    if (requestorRole === 'client' && job.requestedById.toString() !== requestorId) {
      throw new AppError('Access denied', 403);
    }

    return job;
  }

  /**
   * List export jobs for the requestor.
   */
  static async listJobs(
    requestorId: string,
    requestorRole: string,
    query: { status?: ExportJobStatus; page?: unknown; limit?: unknown }
  ): Promise<{ jobs: IExportJobDocument[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const filter: Record<string, unknown> = {};

    // Clients only see their own exports; admins can see all
    if (requestorRole !== 'admin') {
      filter.requestedById = new Types.ObjectId(requestorId);
    }

    if (query.status) filter.status = query.status;

    const [jobs, total] = await Promise.all([
      ExportJob.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ExportJob.countDocuments(filter),
    ]);

    return {
      jobs: jobs as unknown as IExportJobDocument[],
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Generate a download URL for a completed export.
   * In production this returns a pre-signed S3 URL.
   */
  static async getDownloadUrl(
    jobId: string,
    requestorId: string,
    requestorRole: string
  ): Promise<{ downloadUrl: string; outputFileName: string }> {
    const job = await this.getJobById(jobId, requestorId, requestorRole);

    if (job.status === ExportJobStatus.Expired) {
      throw new AppError('This export has expired. Please generate a new export.', 410);
    }

    if (job.status !== ExportJobStatus.Completed) {
      throw new AppError('Export is not yet ready for download.', 409);
    }

    if (!job.outputStoragePath) {
      throw new AppError('Export file not available.', 404);
    }

    // Generate a download URL for the export file.
    // When AWS S3 is configured (AWS_S3_BUCKET set), this should be replaced
    // with a real pre-signed URL via the S3 SDK:
    //   const url = await s3.getSignedUrlPromise('getObject', {
    //     Bucket: process.env.AWS_S3_BUCKET,
    //     Key: job.outputStoragePath,
    //     Expires: 900,  // 15-minute expiry per architecture spec
    //   });
    //
    // For the current deployment (no S3 configured), the file is served
    // from the local storage path via the /file endpoint.
    const downloadUrl = job.outputStoragePath
      ? `/api/v1/exports/${jobId}/file`
      : null;

    if (!downloadUrl) {
      throw new AppError('Export file path not recorded.', 500);
    }

    return {
      downloadUrl,
      outputFileName: job.outputFileName ?? 'export.zip',
    };
  }

  /**
   * Mark a job as processing (called by worker).
   */
  static async markProcessing(jobId: string): Promise<void> {
    await ExportJob.updateOne(
      { _id: jobId, status: ExportJobStatus.Queued },
      { $set: { status: ExportJobStatus.Processing, startedAt: new Date() } }
    );
  }

  /**
   * Mark a job as completed (called by worker on success).
   */
  static async markCompleted(
    jobId: string,
    outputStoragePath: string,
    outputFileName: string,
    fileSizeBytes: number
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPORT_EXPIRY_DAYS);

    const job = await ExportJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: ExportJobStatus.Completed,
          outputStoragePath,
          outputFileName,
          fileSizeBytes,
          completedAt: new Date(),
          expiresAt,
        },
      },
      { new: true }
    );

    if (!job) return;

    // Notify requestor
    await NotificationService.create({
      recipientId: job.requestedById,
      notificationType: NotificationType.ExportCompleted,
      category: NotificationCategory.Export,
      title: 'Your export is ready',
      message: `Your export "${outputFileName}" is ready to download.`,
      shortMessage: `Export ready: ${outputFileName}`,
      actionUrl: `/exports/${jobId}/download`,
      actionLabel: 'Download',
      priority: NotificationPriority.Low,
      visibleToClient: job.requestedByRole === ExportRequestorRole.Client,
      internalOnly: false,
    });

    await AuditService.log({
      entityType: 'export_job',
      entityId: job._id as Types.ObjectId,
      action: AuditAction.ExportCompleted,
      category: AuditCategory.Export,
      source: AuditSource.System,
      metadata: { outputFileName, fileSizeBytes },
    });
  }

  /**
   * Mark a job as failed (called by worker on error).
   */
  static async markFailed(jobId: string, errorMessage: string): Promise<void> {
    const job = await ExportJob.findById(jobId);
    if (!job) return;

    const newRetryCount = job.retryCount + 1;
    const isPermanent = newRetryCount >= 3;

    await ExportJob.updateOne(
      { _id: jobId },
      {
        $set: {
          status: isPermanent ? ExportJobStatus.FailedPermanent : ExportJobStatus.Failed,
          errorMessage,
          retryCount: newRetryCount,
        },
      }
    );

    if (isPermanent) {
      await AuditService.log({
        entityType: 'export_job',
        entityId: job._id as Types.ObjectId,
        action: AuditAction.ExportFailed,
        category: AuditCategory.Export,
        source: AuditSource.System,
        metadata: { errorMessage, retryCount: newRetryCount },
      });

      logger.error('[ExportService] Export permanently failed', { jobId, errorMessage });
    }
  }
}
