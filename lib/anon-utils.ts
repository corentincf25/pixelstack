const COOKIE_NAME = "ps_anon_sid";

export function getAnonSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1].trim() : null;
}

export const ANON_LIMITS = {
  maxMessages: 5,
  maxUploads: 3,
} as const;
