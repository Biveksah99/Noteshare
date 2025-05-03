
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/signup'];

  // Get authentication status (this usually involves checking a cookie or token)
  // NOTE: Middleware runs on the edge/server, it CANNOT directly access browser APIs like localStorage
  // or rely on client-side auth state hooks. You need a server-readable token (e.g., in cookies).
  // For this example, we'll simulate checking a hypothetical auth cookie.
  const isAuthenticated = request.cookies.has('authToken'); // Replace 'authToken' with your actual auth token cookie name

  // If trying to access a protected route and not authenticated, redirect to login
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    console.log(`Middleware: Unauthenticated access to ${pathname}. Redirecting to /login.`);
    const loginUrl = new URL('/login', request.url);
    // Optionally add a 'redirectedFrom' query param
    // loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access login/signup page and already authenticated, redirect to home
  if (isAuthenticated && publicPaths.includes(pathname)) {
     console.log(`Middleware: Authenticated access to ${pathname}. Redirecting to /.`);
     return NextResponse.redirect(new URL('/', request.url));
  }


  // Allow the request to proceed if authenticated or accessing a public path
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
