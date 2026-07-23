import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect all routes by default
export default withAuth(
  function middleware(req) {
    console.log("Middleware executing for path:", req.nextUrl.pathname); // Debug log
    const token = req.nextauth.token;
    const isAuth = !!token;
    console.log("Auth status:", isAuth); // Debug log

    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return null;
    }

    if (!isAuth) {
      console.log("Redirecting unauthorized access to signin"); // Debug log
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

// Update the matcher to include all protected routes and exclude public routes
export const config = {
  matcher: [
    '/',
    '/mme',
    '/mme/:path*',
    '/asset/:path*',
    '/fixedasset/:path*',
    '/loglocation/:path*',
    '/auth/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|public|auth).*)',
  ]
};
