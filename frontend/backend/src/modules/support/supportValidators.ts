import { z } from 'zod';
import { SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '../../models/supportTicketEnums';

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(300).trim(),
  description: z.string().min(10).max(5000).trim(),
  category: z.nativeEnum(SupportTicketCategory).default(SupportTicketCategory.General),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  relatedProjectId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  relatedTaskId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  relatedDocumentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const addMessageSchema = z.object({
  message: z.string().min(1).max(5000).trim(),
  visibleToClient: z.boolean().optional(),
  attachments: z.array(z.string().max(500)).max(5).optional(),
});

export const updateTicketSchema = z.object({
  ticketStatus: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  assignedToId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  internalNotes: z.string().max(5000).optional(),
  slaDeadline: z.string().datetime().optional(),
});

export const ticketListQuerySchema = z.object({
  status: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  category: z.nativeEnum(SupportTicketCategory).optional(),
  assignedToId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTicketDTO = z.infer<typeof createTicketSchema>;
export type AddMessageDTO = z.infer<typeof addMessageSchema>;
export type UpdateTicketDTO = z.infer<typeof updateTicketSchema>;
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
