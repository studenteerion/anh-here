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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AttendanceHistoryData {
  period: string;
  startDate: string;
  endDate: string;
  history: DayAttendance[];
  totalDays: number;
  pagination?: PaginationInfo;
}

export type AttendancePeriod = 'today' | 'week' | 'month' | 'custom' | 'all';
