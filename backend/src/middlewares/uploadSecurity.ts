/**
 * KlawTax Upload Security Middleware
 *
 * Validation-layer protections for file uploads.
 * This module does NOT handle transport (no multer/busboy) — it validates
 * file metadata after the upload framework has parsed the multipart request.
 *
 * Usage:
 *   Apply validateUploadedFile() after multer/upload middleware to
 *   enforce security constraints on the uploaded file object.
 *
 *   Apply validateUploadMetadata() to validate filename/mimetype
 *   from request body when physical upload is to S3 directly.
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum file size: 5 MB in bytes */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum filename length */
const MAX_FILENAME_LENGTH = 200;

/**
 * Allowed MIME types for document uploads.
 * This is the definitive allowlist — anything not listed is rejected.
 */
export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  // Archives (for export bundles)
  'application/zip',
  'application/x-zip-compressed',
]);

/**
 * Allowed file extensions (matched against the original filename).
 */
export const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.zip',
]);

/**
 * Extensions that are always rejected regardless of MIME type.
 * Belt-and-suspenders against upload attacks.
 */
export const BLOCKED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.psm1', '.ps2',
  '.com', '.pif', '.scr', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.msc', '.msi', '.reg', '.dll', '.so',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
  '.cgi', '.hta', '.htaccess', '.env', '.config',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export interface FileMetadata {
  originalname: string;
  mimetype: string;
  size: number;
}

// ─── Core Validation Logic ────────────────────────────────────────────────────

/**
 * Sanitize a filename:
 *   - Strip path traversal characters
 *   - Replace whitespace with underscores
 *   - Remove characters that are unsafe in S3 keys / filesystems
 *   - Truncate to max length
 *   - Preserve the extension
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const base = path.basename(filename);

  // Replace unsafe characters
  const sanitized = base
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+/, ''); // no leading dots or underscores

  // Truncate — keep extension intact
  const ext = path.extname(sanitized).toLowerCase();
  const name = path.basename(sanitized, ext);
  const truncatedName = name.slice(0, MAX_FILENAME_LENGTH - ext.length - 1);

  return `${truncatedName}${ext}` || 'unnamed_file';
}

/**
 * Validate a file upload against security constraints.
 * Returns a structured result so callers can decide how to respond.
 */
export function validateFileUpload(file: FileMetadata): UploadValidationResult {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Check for blocked extensions first (highest priority)
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is not permitted for security reasons.`,
    };
  }

  // 2. Check allowed extensions
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension "${ext}" is not supported. Allowed: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, webp, zip.`,
    };
  }

  // 3. Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return {
      valid: false,
      error: `File type "${file.mimetype}" is not supported.`,
    };
  }

  // 4. Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size ${sizeMb}MB exceeds the maximum allowed size of 5MB.`,
    };
  }

  // 5. Check filename length
  if (file.originalname.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: 'Filename is too long. Maximum 200 characters.',
    };
  }

  return {
    valid: true,
    sanitizedFilename: sanitizeFilename(file.originalname),
  };
}

// ─── Express Middleware ───────────────────────────────────────────────────────

/**
 * Middleware to validate a single uploaded file on req.file.
 * Compatible with multer's req.file shape.
 *
 * Apply AFTER multer middleware.
 */
export function validateUploadedFile(
  req: Request & { file?: FileMetadata },
  res: Response,
  next: NextFunction
): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded.' },
    });
    return;
  }

  const result = validateFileUpload(req.file);

  if (!result.valid) {
    res.status(422).json({
      success: false,
      error: { code: 'INVALID_FILE', message: result.error },
    });
    return;
  }

  // Attach sanitized filename to request for downstream use
  (req as Request & { sanitizedFilename?: string }).sanitizedFilename =
    result.sanitizedFilename;

  next();
}

/**
 * Validate upload metadata from request body
 * (for direct-to-S3 flows where physical file is uploaded client-side).
 */
export function validateUploadMetadata(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { originalname, mimetype, size } = req.body as Partial<FileMetadata>;

  if (!originalname || !mimetype || size === undefined) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FILE_METADATA',
        message: 'File metadata (originalname, mimetype, size) is required.',
      },
    });
    return;
  }

  const result = validateFileUpload({
    originalname,
    mimetype,
    size: Number(size),
  });

  if (!result.valid) {
    res.status(422).json({
      success: false,
      error: { code: 'INVALID_FILE', message: result.error },
    });
    return;
  }

  (req as Request & { sanitizedFilename?: string }).sanitizedFilename =
    result.sanitizedFilename;

  next();
}
