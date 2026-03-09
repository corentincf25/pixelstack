const COOKIE_NAME = "ps_anon_sid";

export function getAnonSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1].trim() : null;
}

export const ANON_LIMITS = {
  /** Messages illimités pour les invités. */
  maxMessages: 99999,
  /** 3 fichiers max (assets + pièces jointes chat) pour invités. */
  maxUploads: 3,
} as const;
