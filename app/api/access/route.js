import { timingSafeEqual } from "node:crypto";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessPassword, accessToken } from "@/lib/access";

export const runtime = "nodejs";

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const expected = accessPassword();
  if (!expected || !password || !same(password.trim(), expected)) {
    // A small delay makes guessing the password by brute force slow.
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ ok: false, error: "That password isn't right." }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${await accessToken()}; Path=/; Max-Age=${ACCESS_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
  );
  return res;
}
