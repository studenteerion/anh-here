/**
 * Common types used across the application
 */

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: PaginationMetadata;
}

export interface ErrorResponse {
  error: string;
  status: number;
}
