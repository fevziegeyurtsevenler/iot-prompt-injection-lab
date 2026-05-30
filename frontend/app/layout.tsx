import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT & LLM Güvenliği: Prompt Injection Nasıl Çalışır?",
  description:
    "Bir yapay zeka ajanı akıllı evinizi yönettiğinde, ona gönderilen tek bir gizli mesaj alarmınızı kapatabilir. Bu laboratuvarda bunu adım adım kendiniz deneyimleyeceksiniz.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Spectral:ital,wght@0,300;0,400;0,500;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#F4F0E8" }}>
        {children}
      </body>
    </html>
  );
}
