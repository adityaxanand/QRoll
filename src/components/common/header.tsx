
"use client";

import Link from 'next/link';
import { QrCode, LogIn, LogOut, UserCircle, Settings, ShieldCheck, UserCog, Users, UserPlus, CalendarDays } from 'lucide-react'; // Added CalendarDays
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, userProfile, logout, loading } = useAuth();
  const router = useRouter();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
          <QrCode className="h-7 w-7" />
          <span>QRoll</span>
        </Link>
        <nav className="flex items-center gap-4">
          {loading ? (
             <Skeleton className="h-8 w-24 rounded-md" />
          ) : user && userProfile ? (
            <>
              {userProfile.role === 'teacher' && (
                <Link href="/teacher" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center">
                  <ShieldCheck className="mr-1 h-4 w-4" /> QR Dashboard
                </Link>
              )}
              {userProfile.role === 'student' && (
                <Link href="/student" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center">
                  <UserCog className="mr-1 h-4 w-4" /> Student Dashboard
                </Link>
              )}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile.profilePictureUrl || undefined} alt={userProfile.displayName || user?.email || 'User'} data-ai-hint="profile avatar"/>
                    <AvatarFallback>{getInitials(userProfile.displayName || user?.email || undefined)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      Role: {userProfile.role || 'N/A'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userProfile.role === 'student' && (
                   <Link href="/student/profile" passHref>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                    </DropdownMenuItem>
                   </Link>
                )}
                {userProfile.role === 'teacher' && (
                   <Link href="/teacher/attendance" passHref>
                    <DropdownMenuItem>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        View Attendance
                    </DropdownMenuItem>
                   </Link>
                )}
                <DropdownMenuItem onClick={async () => { await logout(); router.push('/login');}}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
