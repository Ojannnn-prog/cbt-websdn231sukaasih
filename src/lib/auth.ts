import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nextcbt_session";
const configuredSecret = process.env.AUTH_SECRET;
if (!configuredSecret) throw new Error("AUTH_SECRET wajib dikonfigurasi.");
const sessionSecret = new TextEncoder().encode(configuredSecret);

export type SessionUser = {
  id: string;
  username: string;
  role: "ADMIN" | "STUDENT";
  name: string | null;
  absenNumber: number | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(sessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: new Date(0), path: "/" });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    if (!payload.id || !payload.username || !payload.role) return null;
    return {
      id: String(payload.id),
      username: String(payload.username),
      role: payload.role === "ADMIN" ? "ADMIN" : "STUDENT",
      name: payload.name ? String(payload.name) : null,
      absenNumber: typeof payload.absenNumber === "number" ? payload.absenNumber : null,
    };
  } catch {
    return null;
  }
}
