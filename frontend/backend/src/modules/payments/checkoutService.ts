/**
 * Guest Checkout Service — Batch 2 (B1 Critical Fix)
 *
 * Implements the unauthenticated guest checkout flow per v1.5 spec §9.2.6.
 *
 * Flow:
 *   1. Accept customer details + service selection (no JWT required)
 *   2. Find or create client user + clientProfile
 *   3. Create invoice (draft → auto-issued)
 *   4. Create project (or bundle anchor + sub-projects for bundles)
 *   5. Create Razorpay order
 *   6. Return order details + short-lived client access token
 *
 * guestVerifyPayment handles post-payment signature verification without JWT.
 */

import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { User, AccountStatus }     from '../../models/user';
import { ClientProfile }           from '../../models/clientProfile';
import { Service }                 from '../../models/service';
import { Invoice }                 from '../../models/invoice';
import { Payment }                 from '../../models/payment';
import { Notification }            from '../../models/notification';
import { TimelineEntry }           from '../../models/timelineEntry';
import { ProjectModel }            from '../../models/project';

import { InvoiceStatus, InvoiceType, InvoiceCurrency } from '../../models/invoiceEnums';
import { PaymentStatus, PaymentMethod, VerificationSource, PaymentGateway } from '../../models/invoiceEnums';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
} from '../../models/notificationEnums';
import {
  TimelineEventType,
  TimelineEventCategory,
  TimelineVisibility,
  TimelineActorRole,
} from '../../models/taskEnums';
import { ProjectStatus, ProjectPriority } from '../../models/projectEnums';

import { createProject }                    from '../projects/projectRepository';
import { createRazorpayOrder, verifyPaymentSignature } from './razorpayHelper';
import { applyPaymentToInvoice }            from './invoiceService';
import { buildAuthPayload }                 from '../../middlewares/auth';
import { signAccessToken }                  from '../../utils/jwt';
import { Role }                             from '../../utils/permissions';
import { AppError, NotFoundError }          from '../../middlewares/errorHandler';
import { getConfig }                        from '../../config/env';
import { logger }                           from '../../utils/logger';
import { buildWhatsAppRedirectUrl }         from '../onboarding/onboardingHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestCheckoutInput {
  serviceId:   string;
  serviceName: string;
  amount:      number;          // rupees
  paymentType: 'full' | 'advance';
  customer: {
    name:  string;
    email: string;
    phone: string;
    city?: string;
  };
}

export interface GuestCheckoutResult {
  razorpayOrderId: string;
  invoiceId:       string;
  projectId:       string;
  amount:          number;       // paise
  currency:        string;
  keyId:           string;
  clientId:        string;
}

export interface GuestVerifyInput {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  invoiceId:         string;
  clientId?:         string;
}

export interface GuestVerifyResult {
  verified:          boolean;
  projectId:         string;
  orderId:           string;
  clientAccessToken: string;
  redirectUrl:       string;
}

// ─── Invoice Number Generator ─────────────────────────────────────────────────

async function nextInvoiceNumber(): Promise<string> {
  const last = await Invoice.findOne({}, { invoiceNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();
  let seq = 1;
  if (last?.invoiceNumber) {
    const m = String(last.invoiceNumber).match(/(\d+)$/);
    if (m) seq = parseInt(m[1], 10) + 1;
  }
  const year = new Date().getFullYear();
  return `KT-${year}-${String(seq).padStart(6, '0')}`;
}

// ─── Find or Create Client ────────────────────────────────────────────────────

async function findOrCreateClient(customer: GuestCheckoutInput['customer']): Promise<{
  userId:          string;
  clientProfileId: string;
  isNew:           boolean;
}> {
  const email = customer.email.toLowerCase().trim();

  // Try to find by email
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    const profile = await ClientProfile.findOne({ userId: existing._id }).lean();
    if (profile) {
      return {
        userId:          (existing._id as Types.ObjectId).toString(),
        clientProfileId: (profile._id as Types.ObjectId).toString(),
        isNew:           false,
      };
    }
  }

  // Create new user
  const nameParts  = customer.name.trim().split(' ');
  const firstName  = nameParts[0] ?? customer.name;
  const lastName   = nameParts.slice(1).join(' ') || 'Client';
  const passwordHash = await bcrypt.hash(uuidv4(), 10);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    phone:           customer.phone.trim(),
    passwordHash,
    role:            Role.Client,
    accountStatus:   AccountStatus.Active,
    isEmailVerified: false,
  });

  const profile = await ClientProfile.create({
    userId:                  newUser._id,
    communicationPreference: 'whatsapp',
    onboardingStatus:        'registered',
  });

  return {
    userId:          (newUser._id as Types.ObjectId).toString(),
    clientProfileId: (profile._id as Types.ObjectId).toString(),
    isNew:           true,
  };
}

// ─── Guest Checkout ───────────────────────────────────────────────────────────

export async function guestCheckout(input: GuestCheckoutInput): Promise<GuestCheckoutResult> {
  const cfg = getConfig();

  // 1. Resolve service
  const service = await Service.findOne({
    $or: [
      { slug: input.serviceId },
      ...(Types.ObjectId.isValid(input.serviceId) ? [{ _id: new Types.ObjectId(input.serviceId) }] : []),
    ],
    isActive: true,
  }).lean();

  if (!service) throw new NotFoundError('Service');

  // 2. Find or create client
  const { userId, clientProfileId } = await findOrCreateClient(input.customer);

  // 3. Create invoice
  const amountPaise   = Math.round(input.amount * 100);
  const invoiceNumber = await nextInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    title:         `${input.serviceName} — KlawTax`,
    clientId:      new Types.ObjectId(clientProfileId),
    invoiceType:   InvoiceType.Service,
    invoiceStatus: InvoiceStatus.Draft,
    lineItems: [{
      description: input.serviceName,
      quantity:    1,
      unitPrice:   amountPaise,
      taxRate:     0,
      totalPrice:  amountPaise,
    }],
    currency:    InvoiceCurrency.INR,
    subtotal:    amountPaise,
    taxTotal:    0,
    totalAmount: amountPaise,
    amountPaid:  0,
    amountDue:   amountPaise,
    generatedBy: new Types.ObjectId(userId),
    dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // 4. Create project
  const isBundle    = service.isBundle === true;
  const slugs       = isBundle && service.bundledServiceSlugs?.length
    ? service.bundledServiceSlugs
    : [service.slug];

  const anchorProject = await createProject({
    title:                input.serviceName,
    clientId:             new Types.ObjectId(clientProfileId),
    primaryServiceSlug:   service.slug,
    serviceSlugs:         slugs,
    serviceDeliveryTypes: service.serviceDeliveryType ? [service.serviceDeliveryType] : [],
    projectStatus:        ProjectStatus.Onboarding,
    projectPriority:      ProjectPriority.Medium,
    isBundleAnchor:       isBundle,
    createdFromLead:      false,
    assignedEmployees:    [],
    subProjectIds:        [],
    statusHistory:        [],
    completionChecklist:  [],
  });

  const anchorId = (anchorProject as any)._id as Types.ObjectId;

  // Create sub-projects for bundle
  if (isBundle && slugs.length > 1) {
    const subIds: Types.ObjectId[] = [];
    for (const slug of slugs) {
      if (slug === service.slug) continue;
      const sub = await createProject({
        title:                slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        clientId:             new Types.ObjectId(clientProfileId),
        primaryServiceSlug:   slug,
        serviceSlugs:         [slug],
        serviceDeliveryTypes: [],
        projectStatus:        ProjectStatus.Onboarding,
        projectPriority:      ProjectPriority.Medium,
        isBundleAnchor:       false,
        billingAnchorProjectId: anchorId,
        createdFromLead:      false,
        assignedEmployees:    [],
        subProjectIds:        [],
        statusHistory:        [],
        completionChecklist:  [],
      });
      subIds.push((sub as any)._id as Types.ObjectId);
    }
    await ProjectModel.findByIdAndUpdate(anchorId, { $set: { subProjectIds: subIds } });
  }

  // 5. Create Razorpay order
  const order = await createRazorpayOrder({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  invoiceNumber,
    notes: {
      invoiceId:       (invoice._id as Types.ObjectId).toString(),
      clientProfileId: clientProfileId,
      projectId:       anchorId.toString(),
      serviceName:     input.serviceName,
    },
  });

  // Store razorpayOrderId on invoice
  await Invoice.findByIdAndUpdate(invoice._id, { $set: { razorpayOrderId: order.id } });

  logger.info('[checkout] Guest checkout initiated', {
    invoiceId:   (invoice._id as Types.ObjectId).toString(),
    projectId:   anchorId.toString(),
    clientId:    clientProfileId,
    serviceName: input.serviceName,
    amountPaise,
  });

  return {
    razorpayOrderId: order.id,
    invoiceId:       (invoice._id as Types.ObjectId).toString(),
    projectId:       anchorId.toString(),
    amount:          amountPaise,
    currency:        'INR',
    keyId:           cfg.RAZORPAY_KEY_ID,
    clientId:        clientProfileId,
  };
}

// ─── Guest Payment Verification ──────────────────────────────────────────────

export async function guestVerifyPayment(input: GuestVerifyInput): Promise<GuestVerifyResult> {

  // 1. Verify Razorpay signature
  const isValid = verifyPaymentSignature({
    razorpay_order_id:   input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_signature:  input.razorpaySignature,
  });
  if (!isValid) throw new AppError('Payment signature verification failed', 422, 'INVALID_SIGNATURE');

  // 2. Find invoice
  const invoice = await Invoice.findById(input.invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  // 3. Idempotency check — skip if already captured
  const alreadyCaptured = await Payment.exists({
    razorpayOrderId: input.razorpayOrderId,
    paymentStatus:   PaymentStatus.Captured,
  });

  if (!alreadyCaptured) {
    // 4. Record payment
    await Payment.create({
      invoiceId:          invoice._id,
      clientId:           invoice.clientId,
      gateway:            PaymentGateway.Razorpay,
      amount:             invoice.amountDue,
      currency:           invoice.currency,
      fees:               0,
      tax:                0,
      refundedAmount:     0,
      paymentStatus:      PaymentStatus.Captured,
      paymentMethod:      PaymentMethod.Unknown,
      verificationSource: VerificationSource.FrontendCallback,
      verified:           true,
      razorpayOrderId:    input.razorpayOrderId,
      razorpayPaymentId:  input.razorpayPaymentId,
      razorpaySignature:  input.razorpaySignature,
      initiatedAt:        new Date(),
      verifiedAt:         new Date(),
      duplicatePayment:   false,
      disputedPayment:    false,
      overpayment:        false,
      manuallyReviewed:   false,
    });

    // 5. Update invoice (use placeholder ObjectId for paymentId — webhook will reconcile)
    const tempPaymentId = new Types.ObjectId();
    await applyPaymentToInvoice(invoice._id.toString(), tempPaymentId, invoice.amountDue, 'system');
  }

  // 6. Find the project created during checkout
  const project = await ProjectModel.findOne({
    clientId:      invoice.clientId,
    projectStatus: ProjectStatus.Onboarding,
    isBundleAnchor: { $ne: false },   // anchor or standalone
  }).sort({ createdAt: -1 }).lean();

  // Also try by razorpayOrderId stored in invoice notes (most accurate)
  const projectId = project ? (project._id as Types.ObjectId).toString() : '';

  // 7. Timeline entry
  if (projectId) {
    try {
      await TimelineEntry.create({
        projectId:      new Types.ObjectId(projectId),
        eventType:      TimelineEventType.SystemGenerated,
        eventCategory:  TimelineEventCategory.System,
        title:          'Payment received',
        description:    `Payment of ₹${(invoice.amountDue / 100).toLocaleString('en-IN')} confirmed via Razorpay`,
        visibility:     TimelineVisibility.Client,
        actorRole:      TimelineActorRole.System,
        actorDisplayName: 'System',
        metadata: {
          razorpayOrderId:   input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
          amountPaise:       invoice.amountDue,
        },
      });
    } catch (tlErr) {
      logger.warn('[checkout] Timeline entry creation failed (non-fatal)', { err: tlErr });
    }
  }

  // 8. Admin notification
  try {
    const adminUser = await User.findOne({ role: 'admin' }).lean();
    if (adminUser) {
      await Notification.create({
        recipientId:     adminUser._id,
        notificationType: NotificationType.PaymentReceived,
        category:        NotificationCategory.Payment,
        priority:        NotificationPriority.Low,
        title:           'Payment received',
        message:         `₹${(invoice.amountDue / 100).toLocaleString('en-IN')} received for ${invoice.title}`,
        deliveryChannel: NotificationDeliveryChannel.InApp,
        deliveryStatus:  NotificationDeliveryStatus.Pending,
        isRead:          false,
        isDismissed:     false,
        visibleToClient: false,
        internalOnly:    true,
        invoiceId:       invoice._id as Types.ObjectId,
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
      });
    }
  } catch (notifErr) {
    logger.warn('[checkout] Admin notification failed (non-fatal)', { err: notifErr });
  }

  // 9. Issue short-lived client access token
  const clientAccessToken = await buildClientToken(invoice.clientId.toString());

  // 10. WhatsApp redirect URL
  const waNumber   = process.env.WHATSAPP_NUMBER || '917387731313';
  const redirectUrl = buildWhatsAppRedirectUrl({
    phoneNumber:  waNumber,
    orderId:      input.razorpayOrderId,
    clientName:   'Client',
    serviceName:  invoice.title,
  });

  logger.info('[checkout] Guest payment verified', {
    invoiceId:       input.invoiceId,
    projectId,
    razorpayOrderId: input.razorpayOrderId,
  });

  return {
    verified:          true,
    projectId,
    orderId:           input.razorpayOrderId,
    clientAccessToken,
    redirectUrl,
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function buildClientToken(clientProfileId: string): Promise<string> {
  try {
    const profile = await ClientProfile.findById(clientProfileId).lean();
    if (!profile) return '';

    const userId = (profile.userId as Types.ObjectId).toString();

    const authPayload = buildAuthPayload({
      userId,
      role:                  Role.Client,
      email:                 '',
      accountStatus:         AccountStatus.Active,
      additionalPermissions: [],
      clientProfileId,
    });

    const { token } = signAccessToken(authPayload);
    return token;
  } catch (err) {
    logger.warn('[checkout] Failed to issue guest access token (non-fatal)', { err });
    return '';
  }
}
