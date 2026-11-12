import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

function nextWithLocale(request: NextRequest, locale: Locale) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function isStudioPath(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

function isStudioApiPath(pathname: string) {
  return pathname === "/api/studio" || pathname.startsWith("/api/studio/");
}

/** Edge Middleware - required by @opennextjs/cloudflare (proxy.ts / Node middleware unsupported). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/files") ||
    pathname.startsWith("/img") ||
    pathname === "/cv" ||
    pathname.startsWith("/cv/")
  ) {
    return NextResponse.next();
  }

  // Studio is outside the locale tree (hidden admin surface).
  if (isStudioPath(pathname) || isStudioApiPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
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
