import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminEmails } from "@/lib/admin-users";

/**
 * Access model:
 *  - guest          : may VIEW every page (prices/values are masked as "***"
 *                     by the API layer). No create / update / delete.
 *  - signed-in user : may VIEW every page with real values.
 *                     Still no create / update / delete.
 *  - admin          : signed in AND email present in the ADMIN_USERS env
 *                     variable. Only admins may call mutating API methods.
 */

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Auth endpoints (login, register, password reset, session ...) stay open
// so users can sign in and manage their own account.
const OPEN_API_PREFIXES = ["/api/auth/"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  /* ------------------------------ API guard ------------------------------ */
  if (pathname.startsWith("/api/")) {
    const isOpenApi = OPEN_API_PREFIXES.some((p) => pathname.startsWith(p));

    if (!isOpenApi && MUTATION_METHODS.has(req.method)) {
      const email = ((token as any)?.email as string | undefined)?.toLowerCase() || "";
      const isAdmin =
        !!token && ((token as any)?.isAdmin === true || getAdminEmails().includes(email));

      if (!isAdmin) {
        return NextResponse.json(
          {
            error:
              "Forbidden: only admin users can create, update or delete data.",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  /* ----------------------------- Auth pages ------------------------------ */
  if (pathname.startsWith("/auth")) {
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  /* --------------------------- Page routes ------------------------------- */
  // Guests and signed-in users may both view every page. The API layer masks
  // sensitive values for guests and the UI hides admin-only actions.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals and static files so the
     * API mutation guard applies application-wide.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
