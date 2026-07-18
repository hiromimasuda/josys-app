import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SwRegister } from "@/components/SwRegister";
import { seedValidation } from "@ops/domain";

export const metadata: Metadata = {
  title: "情シス Ops Navigator (DEMO)",
  description:
    "発生事象から最初の安全な行動へ案内する社内ポータルのプロトタイプ。合成デモデータのみ。",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
};

// §5.1 グローバルナビゲーション
const desktopNav = [
  { href: "/home", label: "今日の情シス" },
  { href: "/events", label: "発生時アクション" },
  { href: "/cases", label: "ケース" },
  { href: "/operations", label: "業務43" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/ask", label: "AI相談" },
  { href: "/knowledge", label: "ナレッジ" },
  { href: "/approvals", label: "承認・例外" },
  { href: "/handover", label: "引継ぎ" },
  { href: "/admin", label: "管理" },
];

const mobileNav = [
  { href: "/home", label: "ホーム" },
  { href: "/events", label: "発生時" },
  { href: "/ask", label: "AI相談" },
  { href: "/calendar", label: "期限" },
  { href: "/menu", label: "その他" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-blue-800 focus:px-3 focus:py-2 focus:text-white"
        >
          本文へスキップ
        </a>
        <SwRegister />
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
            <div className="flex items-center gap-2">
              <Link href="/home" className="tap flex items-center gap-2 font-bold text-blue-900">
                情シス Ops Navigator
              </Link>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                DEMO_ONLY
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/emergency"
                className="tap flex items-center whitespace-nowrap rounded-lg border-2 border-red-400 bg-red-50 px-3 py-1 text-sm font-bold text-red-800"
              >
                緊急パック
              </Link>
              <RoleSwitcher />
            </div>
          </div>
        </header>
        <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4">
          <nav aria-label="メインナビゲーション" className="hidden w-48 shrink-0 lg:block">
            <ul className="sticky top-16 space-y-1">
              {desktopNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="tap flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <main id="main" className="min-w-0 flex-1 pb-24 lg:pb-8">
            {children}
          </main>
        </div>
        <nav
          aria-label="モバイルナビゲーション"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white lg:hidden"
        >
          <ul className="flex">
            {mobileNav.map((item) => (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className="tap flex flex-col items-center justify-center py-2 text-xs font-medium text-slate-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <footer className="mx-auto max-w-6xl px-4 pb-24 pt-4 text-xs text-slate-500 lg:pb-8">
          <p>
            合成デモデータのみ(実データ・外部接続なし) / データ検証:{" "}
            <span data-testid="seed-counts">
              {seedValidation.counts.flows}フロー / {seedValidation.counts.operations}業務 /{" "}
              {seedValidation.counts.eventTemplates}入口
            </span>{" "}
            OK
          </p>
        </footer>
      </body>
    </html>
  );
}
