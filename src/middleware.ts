import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

function nextWithLocale(request: NextRequest, locale: Locale) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/** Edge Middleware — required by @opennextjs/cloudflare (proxy.ts / Node middleware unsupported). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/files") ||
    pathname.startsWith("/img")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/fr/, "") || "/";
    return NextResponse.redirect(url);
  }

  const matched = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (matched) {
    return nextWithLocale(request, matched);
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url, {
    request: {
      headers: (() => {
        const h = new Headers(request.headers);
        h.set("x-locale", defaultLocale);
        return h;
      })(),
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
