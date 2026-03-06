import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixelstack",
  description: "Gérez vos miniatures YouTube en un seul endroit — graphistes et YouTubers",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased relative min-h-screen`}
      >
        {/* Fond noir / anthracite type YouTube dark mode */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden
          style={{
            background: "linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #181818 100%)",
          }}
        />
        {/* Particules discrètes (gris/blanc, pas de teinte bleu/violet) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-50"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.25) 0%, transparent 100%),
                             radial-gradient(1.5px 1.5px at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
                             radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 100%)`,
            backgroundSize: "200px 200px, 180px 180px, 160px 160px",
          }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
