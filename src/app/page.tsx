
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, User, QrCode, ShieldCheck, UserCog } from 'lucide-react';
import { Header } from '@/components/common/header';
import { PageTitle } from '@/components/common/page-title';
import { useAuth } from '@/contexts/auth-context'; // Changed from '@/hooks/use-auth' for consistency
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <PageTitle 
          title="Welcome to QRoll"
          description="Efficient QR code based attendance system with facial verification."
          icon={<QrCode className="h-10 w-10" />}
        />
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          {loading ? (
            <>
              <Skeleton className="h-[220px] w-full rounded-lg" />
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </>
          ) : !user || !userProfile ? (
            <>
             <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Teacher Portal</CardTitle>
                  </div>
                  <CardDescription>
                    Generate QR codes for attendance and manage class sessions. Login as a teacher to access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/login?role=teacher">
                    <Button className="w-full" variant="default">
                      Teacher Login <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <UserCog className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Student Portal</CardTitle>
                  </div>
                  <CardDescription>
                    Scan QR codes to mark attendance and verify your identity. Login as a student to access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/login?role=student">
                    <Button className="w-full" variant="default">
                      Student Login <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {userProfile.role === 'teacher' && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                      <CardTitle className="text-2xl">Teacher Dashboard</CardTitle>
                    </div>
                    <CardDescription>
                      Generate QR codes for attendance and manage your class sessions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/teacher">
                      <Button className="w-full" variant="default">
                        Go to Teacher Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              {userProfile.role === 'student' && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <UserCog className="h-8 w-8 text-primary" />
                      <CardTitle className="text-2xl">Student Dashboard</CardTitle>
                    </div>
                    <CardDescription>
                      Scan QR codes to mark your attendance and verify your identity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/student">
                      <Button className="w-full" variant="default">
                        Go to Student Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
               {/* Fallback if role is somehow not set but user is logged in */}
              {user && userProfile && !userProfile.role && (
                 <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Account Role Not Set</CardTitle>
                    <CardDescription>
                      Your user role is not defined. Please contact support or try logging out and signing up again correctly.
                    </CardDescription>
                  </CardHeader>
                 </Card>
              )}
            </>
          )}
        </div>
      </main>
      <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} QRoll. All rights reserved.
      </footer>
    </div>
  );
}
