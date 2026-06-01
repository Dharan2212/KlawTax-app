import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../../middlewares/auth';
import { requireEmployee, requireAdmin } from '../../middlewares/rbac';
import {
  getAuthContext,
  getAuthUserId,
} from '../../middlewares/auth';
import { Role } from '../../utils/permissions';
import { sendSuccess } from '../../utils/response';
import { NotFoundError, ForbiddenError } from '../../middlewares/errorHandler';
import {
  validateRegisterDocument,
  validateResubmitDocument,
  validateUpdateVisibility,
  parseListDocumentsQuery,
} from '../../validators/documentValidators';
import {
  registerDocumentUpload,
  listDocuments,
  getDocumentById,
  getVersionHistory,
  resubmitDocument,
  softDeleteDocument,
  generatePresignedDownloadUrl,
} from './documentService';

export const documentRouter = Router();

// ─── POST /documents ─ Register a new document upload ─────────────────────────
documentRouter.post(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const uploadedBy = new Types.ObjectId(auth.userId);

      // Clients can also upload if permitted (checked at route-level by permission)
      const dto = validateRegisterDocument(req.body);

      const clientId =
        auth.role === Role.Client && auth.clientProfileId
          ? new Types.ObjectId(auth.clientProfileId)
          : undefined;

      const doc = await registerDocumentUpload(dto, uploadedBy, clientId);

      sendSuccess(res, { document: doc }, { statusCode: 201, message: 'Document registered successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// Allow clients to upload too (separate endpoint with client auth)
documentRouter.post(
  '/client-upload',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      if (auth.role !== Role.Client && auth.role !== Role.Admin) {
        throw new ForbiddenError('Only clients or admins can use this endpoint');
      }
      const uploadedBy = new Types.ObjectId(auth.userId);
      const dto = validateRegisterDocument(req.body);
      const clientId =
        auth.clientProfileId ? new Types.ObjectId(auth.clientProfileId) : undefined;

      const doc = await registerDocumentUpload(dto, uploadedBy, clientId);
      sendSuccess(res, { document: doc }, { statusCode: 201, message: 'Document registered successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /documents ─ List documents ──────────────────────────────────────────
documentRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth  = getAuthContext(req);
      const role  = auth.role as Role;
      const query = parseListDocumentsQuery(req.query as Record<string, unknown>);

      const clientId =
        role === Role.Client && auth.clientProfileId
          ? new Types.ObjectId(auth.clientProfileId)
          : undefined;

      const { documents, meta } = await listDocuments(query, role, clientId);
      sendSuccess(res, { documents }, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /documents/:id ─ Get single document ─────────────────────────────────
documentRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const role       = auth.role as Role;
      const documentId = new Types.ObjectId(req.params.id);

      const clientId =
        role === Role.Client && auth.clientProfileId
          ? new Types.ObjectId(auth.clientProfileId)
          : undefined;

      const doc = await getDocumentById(documentId, role, clientId);
      sendSuccess(res, { document: doc });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /documents/:id/download ─ Pre-signed download URL ────────────────────
documentRouter.get(
  '/:id/download',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const role       = auth.role as Role;
      const documentId = new Types.ObjectId(req.params.id);

      const clientId =
        role === Role.Client && auth.clientProfileId
          ? new Types.ObjectId(auth.clientProfileId)
          : undefined;

      // Visibility check embedded in getDocumentById
      const doc     = await getDocumentById(documentId, role, clientId);
      const presign = generatePresignedDownloadUrl(doc);

      sendSuccess(res, presign, { message: 'Pre-signed URL generated' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /documents/:id/versions ─ Version history ────────────────────────────
documentRouter.get(
  '/:id/versions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const role       = auth.role as Role;
      const documentId = new Types.ObjectId(req.params.id);

      const versions = await getVersionHistory(documentId, role);
      sendSuccess(res, { versions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /documents/resubmit ─ Create new version ────────────────────────────
documentRouter.post(
  '/resubmit',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const uploadedBy = new Types.ObjectId(auth.userId);
      const dto        = validateResubmitDocument(req.body);

      const clientId =
        auth.role === Role.Client && auth.clientProfileId
          ? new Types.ObjectId(auth.clientProfileId)
          : undefined;

      const doc = await resubmitDocument(dto, uploadedBy, clientId);
      sendSuccess(res, { document: doc }, { statusCode: 201, message: 'Document resubmitted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /documents/:id/visibility ─ Update visibility ─────────────────────
documentRouter.patch(
  '/:id/visibility',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedBy  = getAuthUserId(req);
      const documentId = new Types.ObjectId(req.params.id);
      const { visibility } = validateUpdateVisibility(req.body);

      const { DocumentModel } = await import('../../models/document');
      const updated = await DocumentModel.findByIdAndUpdate(
        documentId,
        { $set: { visibility, updatedBy } },
        { new: true }
      );
      if (!updated) throw new NotFoundError('Document');

      sendSuccess(res, { document: updated }, { message: 'Visibility updated' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /documents/:id ─ Soft delete ──────────────────────────────────────
documentRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deletedBy  = getAuthUserId(req);
      const documentId = new Types.ObjectId(req.params.id);
      await softDeleteDocument(documentId, deletedBy);
      sendSuccess(res, null, { message: 'Document deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);
