
"use client";

import { Header } from '@/components/common/header';
import { PageTitle } from '@/components/common/page-title';
import { AttendanceList } from '@/components/teacher/attendance-list';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

function TeacherAttendancePageInternal() {
  const { loading: authLoading, userProfile } = useAuth();

  if (authLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <PageTitle
          title="View Attendance Records"
          description={`Review attendance for sessions created by ${userProfile.displayName || 'you'}.`}
          icon={<CalendarDays className="h-10 w-10" />}
        />
        <div className="mt-8">
          <AttendanceList />
        </div>
      </main>
      <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} QRoll. All rights reserved.
      </footer>
    </div>
  );
}

export default function TeacherAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <TeacherAttendancePageInternal />
    </ProtectedRoute>
  );
}
