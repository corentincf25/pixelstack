"use client";

/**
 * Affiche le contenu d'un message chat en conservant les retours à la ligne (whitespace-pre-wrap)
 * et en rendant les URLs en liens cliquables.
 */
const URL_REGEX = /(https?:\/\/[^\s<>]+)/g;

type Props = { content: string; className?: string; linkClassName?: string };

export function ChatMessageContent({ content, className = "", linkClassName = "text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary" }: Props) {
  if (!content?.trim()) return null;

  const parts = content.split(URL_REGEX);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) => {
        const isUrl = part.startsWith("http://") || part.startsWith("https://");
        if (isUrl) {
          return (
            <a
              key={i}
              href={part}
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
