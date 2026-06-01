import { Schema, model, models, Document, Types, Model } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum EmploymentStatus {
  Active    = 'active',
  OnLeave   = 'on_leave',
  Suspended = 'suspended',
  Resigned  = 'resigned',
  Terminated = 'terminated',
}

export enum Department {
  Legal      = 'legal',
  Operations = 'operations',
  Finance    = 'finance',
  Support    = 'support',
  Technology = 'technology',
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IEmployeeProfile {
  /** One-to-one link to the `users` collection. */
  userId: Types.ObjectId;

  // ── Role / Hierarchy ────────────────────────────────────────────────────────
  designation: string;

  department: Department;

  /**
   * ObjectId of the reporting manager (must also be an employee or admin User).
   * Null for top-level employees reporting directly to the admin.
   */
  reportingManagerId?: Types.ObjectId;

  // ── Specialization ──────────────────────────────────────────────────────────
  /**
   * Tags describing the employee's areas of expertise.
   * Used for smart project assignment routing.
   * Examples: ['section8', '12a_80g', 'gst', 'iso']
   */
  specializations: string[];

  /**
   * States/regions the employee is assigned to service.
   * Examples: ['Maharashtra', 'Karnataka']
   */
  assignedRegions: string[];

  // ── Workload Metadata ───────────────────────────────────────────────────────
  /**
   * Current count of active projects assigned to this employee.
   * Maintained by the project service — do NOT update manually.
   */
  activeProjectCount: number;

  /**
   * Soft capacity ceiling for project assignments.
   * Assignment engine will warn (but not block) when this is exceeded.
   */
  maxProjectCapacity: number;

  // ── Employment Details ─────────────────────────────────────────────────────
  employmentStatus: EmploymentStatus;

  joiningDate?: Date;

  /** Date when employment ended. Null for current employees. */
  exitDate?: Date;

  /** Internal employee/staff ID for HR records. */
  employeeCode?: string;

  // ── Contact ────────────────────────────────────────────────────────────────
  /** Work email if different from the login email. */
  workEmail?: string;

  /** Extension or direct work phone. */
  workPhone?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type IEmployeeProfileDocument = IEmployeeProfile & Document;
export type IEmployeeProfileModel = Model<IEmployeeProfileDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const employeeProfileSchema = new Schema<IEmployeeProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    department: {
      type: String,
      enum: Object.values(Department),
      required: true,
      index: true,
    },

    reportingManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    specializations: {
      type: [String],
      default: [],
    },

    assignedRegions: {
      type: [String],
      default: [],
    },

    activeProjectCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxProjectCapacity: {
      type: Number,
      default: 20,
      min: 1,
    },

    employmentStatus: {
      type: String,
      enum: Object.values(EmploymentStatus),
      default: EmploymentStatus.Active,
      index: true,
    },

    joiningDate: {
      type: Date,
    },

    exitDate: {
      type: Date,
    },

    employeeCode: {
      type: String,
      trim: true,
      maxlength: 50,
      sparse: true,
    },

    workEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },

    workPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  {
    timestamps: true,
    collection: 'employeeProfiles',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Assignment engine: find available employees by specialization and status
employeeProfileSchema.index({ employmentStatus: 1, activeProjectCount: 1 });

// Department listing
employeeProfileSchema.index({ department: 1, employmentStatus: 1 });

// Hierarchy traversal: find all employees under a manager
employeeProfileSchema.index({ reportingManagerId: 1 });

// Workload query: employees below capacity threshold
employeeProfileSchema.index({ activeProjectCount: 1, maxProjectCapacity: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const EmployeeProfile: IEmployeeProfileModel =
  (models['EmployeeProfile'] as IEmployeeProfileModel | undefined) ??
  model<IEmployeeProfileDocument>('EmployeeProfile', employeeProfileSchema);
