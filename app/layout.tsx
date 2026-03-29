import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Company",
  description: "Supervisor-Worker AI Multi-Agent System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
