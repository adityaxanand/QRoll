
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';


interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'student' | 'teacher'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('redirectedFrom', pathname);
        router.replace(loginUrl.toString());
      } else if (allowedRoles && userProfile && (!userProfile.role || !allowedRoles.includes(userProfile.role))) {
        // User is logged in but doesn't have the required role
        // Redirect to home or a specific "unauthorized" page
        // For now, redirecting to home.
        router.replace('/');
      }
    }
  }, [user, userProfile, loading, router, allowedRoles, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This state should ideally be brief as the useEffect will redirect.
    // Showing a loader is a good fallback.
     return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }
  
  if (allowedRoles && userProfile && (!userProfile.role || !allowedRoles.includes(userProfile.role))) {
     // User is logged in but role is not allowed for this route.
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
          <AlertDescription>
            You do not have the necessary permissions to view this page. Your current role is 
            <span className="font-semibold capitalize"> {userProfile.role || 'not set'}</span>.
            This page requires one of the following roles: {allowedRoles.join(', ')}.
          </AlertDescription>
        </Alert>
        <Link href="/" className="mt-6">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    );
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
}
