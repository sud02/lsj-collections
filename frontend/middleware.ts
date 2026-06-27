import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Serves the admin portal from a dedicated subdomain (e.g. admin.lsjcollections.com)
 * while keeping a single Next.js app/Vercel project.
 *
 *  - Requests to the admin host are mapped onto the existing /admin/* routes.
 *  - Optionally, /admin on the public site is pushed to the admin subdomain
 *    (enable only AFTER the subdomain's DNS is live: NEXT_PUBLIC_ENFORCE_ADMIN_HOST=true).
 *
 * Configure the host via NEXT_PUBLIC_ADMIN_HOST (defaults below). Anything that
 * isn't the admin host is untouched, so localhost and previews keep working.
 */
const ADMIN_HOST = (process.env.NEXT_PUBLIC_ADMIN_HOST || "admin.lsjcollections.com").toLowerCase();
const ENFORCE = process.env.NEXT_PUBLIC_ENFORCE_ADMIN_HOST === "true";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const url = req.nextUrl;
  const isAdminHost = host === ADMIN_HOST || host.startsWith("admin.");

  if (isAdminHost) {
    // Bare root → the admin app. Redirect (not rewrite) so the browser URL and
    // client routing stay on /admin/*, which the StorefrontChrome relies on.
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    // /admin/* and /api/* are served as-is; any stray storefront path is hidden under /admin.
    if (!url.pathname.startsWith("/admin") && !url.pathname.startsWith("/api")) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // On the public site, send /admin to the dedicated subdomain (prod apex only, opt-in).
  if (ENFORCE && url.pathname.startsWith("/admin")) {
    const apex = ADMIN_HOST.replace(/^admin\./, "");
    if (host === apex || host === `www.${apex}`) {
      const dest = req.nextUrl.clone();
      dest.hostname = ADMIN_HOST;
      dest.protocol = "https:";
      dest.port = "";
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on pages only — skip static assets, image optimizer, and files with extensions.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
