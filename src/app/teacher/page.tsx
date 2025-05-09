
"use client";

import { Header } from '@/components/common/header';
import { PageTitle } from '@/components/common/page-title';
import { QrCodeDisplay } from '@/components/teacher/qr-code-display';
import { Users, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/firebase'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function TeacherDashboardInternal() {
  const { user, userProfile, loading: authLoading } = useAuth();

  if (authLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!db) {
    return (
       <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
           <PageTitle 
              title="Teacher Dashboard"
              description="Service Temporarily Unavailable"
              icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
            />
            <p className="text-destructive mt-4">Database service (Firebase Firestore) is not available. Please ensure Firebase is configured correctly and try again later.</p>
        </main>
        <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
            © {new Date().getFullYear()} QRoll. All rights reserved.
        </footer>
      </div>
    )
  }

  // user.uid from Firebase Auth is the teacherFirebaseId
  // userProfile.displayName is the teacherName
  // userProfile.uid from AuthContext (which is MongoDB _id) is teacherMongoId used internally by QrCodeDisplay

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center">
        <PageTitle 
          title="Teacher Dashboard"
          description={`${userProfile.displayName || 'Teacher'}, generate and display QR codes for student attendance.`}
          icon={<Users className="h-10 w-10" />}
        />
        <div className="mt-8 w-full flex flex-col items-center gap-6">
          <QrCodeDisplay 
            teacherFirebaseId={user?.uid || ''} // Pass Firebase UID
            teacherName={userProfile.displayName || user?.email || 'Unknown Teacher'} 
          />
          <Link href="/teacher/attendance">
            <Button variant="outline">View Attendance Records</Button>
          </Link>
        </div>
      </main>
       <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} QRoll. All rights reserved.
      </footer>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <TeacherDashboardInternal />
    </ProtectedRoute>
  );
}
