import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "業務自動化ハーネス",
    template: "%s ｜ 業務自動化ハーネス",
  },
  description: "共通の実行エンジン + 会社別コネクタ + 承認・監査・復旧",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
