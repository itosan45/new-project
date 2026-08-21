export const SESSION_COOKIE = "vorg_session";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD || "";
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.APP_PASSWORD || "";
  const payload = `${Date.now()}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const secret = process.env.APP_PASSWORD || "";
  if (!secret) return false;
  const key = await importKey(secret);
  const expectedSig = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  if (!timingSafeEqual(expectedSig, sig)) return false;
  const ts = Number(payload);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < THIRTY_DAYS_MS;
}
