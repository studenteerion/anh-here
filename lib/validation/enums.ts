/**
 * Centralized enum validation for all status and type fields
 * Ensures type-safe validation across all endpoints
 */

// Anomaly status enum
export const ANOMALY_STATUSES = ["open", "in_progress", "closed"] as const;
export type AnomalyStatus = (typeof ANOMALY_STATUSES)[number];

// Employee status enum
export const EMPLOYEE_STATUSES = ["active", "inactive"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

// Leave request type enum
export const LEAVE_REQUEST_TYPES = [
  "sick",
  "vacation",
  "personal",
  "other",
] as const;
export type LeaveRequestType = (typeof LEAVE_REQUEST_TYPES)[number];

// Leave request approval status enum
export const LEAVE_REQUEST_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type LeaveRequestApprovalStatus =
  (typeof LEAVE_REQUEST_APPROVAL_STATUSES)[number];

// Leave request overall status enum (derived from approval statuses)
export const LEAVE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];

/**
 * Validates an anomaly status value
 * @throws Error if status is invalid
 */
export function validateAnomalyStatus(
  value: unknown
): asserts value is AnomalyStatus {
  if (!ANOMALY_STATUSES.includes(value as AnomalyStatus)) {
    throw new Error(
      `Invalid anomaly status: "${value}". Must be one of: ${ANOMALY_STATUSES.join(", ")}`
    );
  }
}

/**
 * Validates an employee status value
 * @throws Error if status is invalid
 */
export function validateEmployeeStatus(
  value: unknown
): asserts value is EmployeeStatus {
  if (!EMPLOYEE_STATUSES.includes(value as EmployeeStatus)) {
    throw new Error(
      `Invalid employee status: "${value}". Must be one of: ${EMPLOYEE_STATUSES.join(", ")}`
    );
  }
}

/**
 * Validates a leave request type value
 * @throws Error if type is invalid
 */
export function validateLeaveRequestType(
  value: unknown
): asserts value is LeaveRequestType {
  if (!LEAVE_REQUEST_TYPES.includes(value as LeaveRequestType)) {
    throw new Error(
      `Invalid leave request type: "${value}". Must be one of: ${LEAVE_REQUEST_TYPES.join(", ")}`
    );
  }
}

/**
 * Validates a leave request approval status value
 * @throws Error if status is invalid
 */
export function validateLeaveRequestApprovalStatus(
  value: unknown
): asserts value is LeaveRequestApprovalStatus {
  if (
    !LEAVE_REQUEST_APPROVAL_STATUSES.includes(
      value as LeaveRequestApprovalStatus
    )
  ) {
    throw new Error(
      `Invalid leave request approval status: "${value}". Must be one of: ${LEAVE_REQUEST_APPROVAL_STATUSES.join(", ")}`
    );
  }
}

/**
 * Validates a leave request overall status value
 * @throws Error if status is invalid
 */
export function validateLeaveRequestStatus(
  value: unknown
): asserts value is LeaveRequestStatus {
  if (!LEAVE_REQUEST_STATUSES.includes(value as LeaveRequestStatus)) {
    throw new Error(
      `Invalid leave request status: "${value}". Must be one of: ${LEAVE_REQUEST_STATUSES.join(", ")}`
    );
  }
}

/**
 * Safely validates an enum value without throwing
 * @returns true if valid, false otherwise
 */
export function isValidAnomalyStatus(value: unknown): value is AnomalyStatus {
  return ANOMALY_STATUSES.includes(value as AnomalyStatus);
}

export function isValidEmployeeStatus(value: unknown): value is EmployeeStatus {
  return EMPLOYEE_STATUSES.includes(value as EmployeeStatus);
}

export function isValidLeaveRequestType(
  value: unknown
): value is LeaveRequestType {
  return LEAVE_REQUEST_TYPES.includes(value as LeaveRequestType);
}

export function isValidLeaveRequestApprovalStatus(
  value: unknown
): value is LeaveRequestApprovalStatus {
  return LEAVE_REQUEST_APPROVAL_STATUSES.includes(
    value as LeaveRequestApprovalStatus
  );
}

export function isValidLeaveRequestStatus(
  value: unknown
): value is LeaveRequestStatus {
  return LEAVE_REQUEST_STATUSES.includes(value as LeaveRequestStatus);
}
