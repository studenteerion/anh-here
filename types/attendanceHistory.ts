import { PaginationMetadata } from './common';

export interface AttendanceHistory {
  id: number;
  checkin: string;
  checkout: string | null;
  hours: number | null;
}

export interface Leave {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
}

export interface DayAttendance {
  date: string;
  attendances: AttendanceHistory[];
  totalHours: number;
  leaves: Leave[];
}

export interface AttendanceHistoryData {
  period: string;
  startDate: string;
  endDate: string;
  history: DayAttendance[];
  totalDays: number;
  pagination?: PaginationMetadata;
}

export type AttendancePeriod = 'today' | 'week' | 'month' | 'custom' | 'all';
