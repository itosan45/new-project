import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavActions from "@/components/NavActions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "仮想組織 secretary",
  description: "秘書窓口の仮想組織ダッシュボード",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              🗂️ secretary
            </Link>
            <NavActions />
          </div>
          <nav className="mx-auto flex max-w-2xl gap-4 overflow-x-auto px-4 pb-2 text-sm">
            <Link href="/" className="whitespace-nowrap hover:underline">
              ホーム
            </Link>
            <Link href="/inbox" className="whitespace-nowrap hover:underline">
              inbox
            </Link>
            <Link href="/logs" className="whitespace-nowrap hover:underline">
              logs
            </Link>
            <Link
              href="/departments"
              className="whitespace-nowrap hover:underline"
            >
              departments
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
