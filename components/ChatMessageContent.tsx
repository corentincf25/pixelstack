"use client";

/**
 * Affiche le contenu d'un message chat en conservant les retours à la ligne (whitespace-pre-wrap)
 * et en rendant les URLs en liens cliquables (toujours visibles : soulignés + couleur contrastée).
 */
// Détecte http(s) et www.xxx.yyy pour les transformer en liens cliquables
const URL_REGEX = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+)/g;

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("www.")) return `https://${url}`;
  return url;
}

type Props = { content: string; className?: string; linkClassName?: string };

const DEFAULT_LINK_CLASS =
  "text-sky-400 underline decoration-sky-400/70 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300";

export function ChatMessageContent({
  content,
  className = "",
  linkClassName = DEFAULT_LINK_CLASS,
}: Props) {
  if (!content?.trim()) return null;

  const parts = content.split(URL_REGEX);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) => {
        const isUrl =
          part.startsWith("http://") ||
          part.startsWith("https://") ||
          part.startsWith("www.");
        if (isUrl) {
          const href = normalizeUrl(part);
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
