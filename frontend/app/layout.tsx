import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT & LLM Güvenliği: Prompt Injection Akademisi",
  description:
    "Prompt injection saldırılarını akıllı ev bağlamında adım adım öğrenin. Deniz Tektek & Fevzi Ege Yurtsevenler.",
  authors: [{ name: "Deniz Tektek" }, { name: "Fevzi Ege Yurtsevenler" }],
  keywords: ["prompt injection", "IoT security", "LLM security", "OWASP", "siber güvenlik"],
  robots: "index, follow",
  other: {
    // Statik export -> bu basliklar <meta http-equiv> olarak gomulur.
    // Backend yok: connect-src 'self'. Inline style kullaniyoruz: style-src unsafe-inline.
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-XSS-Protection": "1; mode=block",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Spectral:ital,wght@0,300;0,400;0,500;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#F4F0E8" }}>
        {children}
      </body>
    </html>
  );
}
