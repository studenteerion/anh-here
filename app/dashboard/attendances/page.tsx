import { ClockInOutCard } from '@/components/attendances/ClockInOutCard';
import { AttendanceHistoryTable } from '@/components/attendances/AttendanceHistoryTable';

export default function AttendancesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:gap-6">
        {/* Clock In/Out Section - Full Width */}
        <ClockInOutCard />

        {/* Attendance History Table - Full Width */}
        <AttendanceHistoryTable 
          defaultPeriod="month" 
          defaultLimit={15}
          autoRefresh={true}
          refreshInterval={60000}
        />
      </div>
    </div>
  );
}
