import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "studio_session";

export type AccessIdentity = {
  email: string;
  source: "cloudflare-access" | "dev-password";
};

function accessConfigured() {
  return Boolean(
    process.env.CF_ACCESS_TEAM_DOMAIN && process.env.CF_ACCESS_AUD,
  );
}

function getTeamDomain() {
  const raw = process.env.CF_ACCESS_TEAM_DOMAIN ?? "";
  return raw.replace(/\/$/, "");
}

export async function verifyAccessJwt(
  token: string | null | undefined,
): Promise<AccessIdentity | null> {
  if (!token || !accessConfigured()) return null;

  const teamDomain = getTeamDomain();
  const aud = process.env.CF_ACCESS_AUD!;
  const JWKS = createRemoteJWKSet(
    new URL(`${teamDomain}/cdn-cgi/access/certs`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: teamDomain,
      audience: aud,
    });
    const email =
      typeof payload.email === "string"
        ? payload.email
        : typeof payload.common_name === "string"
          ? payload.common_name
          : "access-user";
    return { email, source: "cloudflare-access" };
  } catch {
    return null;
  }
}

export async function verifyDevSession(): Promise<AccessIdentity | null> {
  if (accessConfigured()) return null;
  const secret = process.env.STUDIO_DEV_PASSWORD;
  if (!secret) return null;

  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const expected = await sha256(`studio:${secret}`);
  if (value !== expected) return null;
  return { email: "dev@local", source: "dev-password" };
}

export async function createDevSessionCookie(password: string) {
  const secret = process.env.STUDIO_DEV_PASSWORD;
  if (!secret || password !== secret) return null;
  return {
    name: SESSION_COOKIE,
    value: await sha256(`studio:${secret}`),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export function clearDevSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export async function requireStudioIdentity(
  request?: Request,
): Promise<AccessIdentity | null> {
  const headerToken =
    request?.headers.get("cf-access-jwt-assertion") ??
    request?.headers.get("Cf-Access-Jwt-Assertion");

  const fromAccess = await verifyAccessJwt(headerToken);
  if (fromAccess) return fromAccess;

  // Browser cookie fallback when Access sets CF_Authorization
  if (request) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
    if (match?.[1]) {
      const fromCookie = await verifyAccessJwt(decodeURIComponent(match[1]));
      if (fromCookie) return fromCookie;
    }
  }

  return verifyDevSession();
}

export function isAccessMode() {
  return accessConfigured();
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
