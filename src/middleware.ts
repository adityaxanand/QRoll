
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FIREBASE_ID_TOKEN_COOKIE = 'firebaseIdToken'; // Ensure this matches cookie name in AuthContext

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/signup', '/']; 
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') return pathname === path; // Exact match for home
    return pathname.startsWith(path); // Starts with for /login, /signup
  });

  const isAuthenticated = request.cookies.has(FIREBASE_ID_TOKEN_COOKIE);

  // If trying to access a protected path and not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If authenticated and trying to access login or signup, redirect to home
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any other specific static assets or public API endpoints
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)', // Added |.*\\..* to exclude files with extensions
  ],
}
