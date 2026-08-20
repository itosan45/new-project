import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui";

/**
 * 役割別のアプリ外枠。
 *
 * 設計書 8. のとおり、管理者は「全社のAgentを見る」、社員は「自分の仕事が
 * どこまで進み、何を確認すべきか」を見る。同じ画面を権限で出し分けるのでは
 * なく、入口から分ける。権限で隠す作りは、隠し忘れが事故に直結する。
 *
 * 幅で組み替える（レスポンシブ）。スマホでは左のメニューを消して、
 * 上のバーと下のタブに移す。190pxの固定メニューは390px幅の画面では
 * 半分を占領してしまい、本文が読めなくなるため。
 * PC用とスマホ用を別々に作ることはしない。同じ画面を2つ管理すると、
 * 片方だけ直してもう片方が古いまま、が必ず起きる。
 */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export function Shell({
  nav,
  activeHref,
  brand,
  footer,
  children,
}: {
  nav: NavItem[];
  activeHref: string;
  brand: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* PC: 左の固定メニュー */}
      <aside className="sticky top-0 hidden h-screen w-[190px] shrink-0 flex-col bg-nav md:flex">
        <div className="px-4 py-5">{brand}</div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2.5">
          {nav.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                // 未実装ルートの先読みで404が大量に出るのを避ける
                prefetch={false}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-nav-active font-medium text-nav-text-active"
                    : "text-nav-text hover:bg-nav-hover"
                }`}
              >
                <Icon name={item.icon} className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-warn px-1.5 py-px text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {footer && <div className="px-3 py-4">{footer}</div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* スマホ: 上のバー。名前とログアウトだけ置く */}
        <div className="flex items-center justify-between gap-3 bg-nav px-4 py-3 md:hidden">
          {brand}
          {footer}
        </div>

        {/* 下のタブぶんの余白。無いと最後の行がタブに隠れる */}
        <div className="min-w-0 flex-1 pb-[72px] md:pb-0">{children}</div>
      </div>

      {/* スマホ: 下のタブ。指が届く位置に置く */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-white/10 bg-nav md:hidden">
        {nav.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`relative flex min-w-[68px] flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] ${
                active ? "text-nav-text-active" : "text-nav-text"
              }`}
            >
              <Icon name={item.icon} className="size-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
              {item.badge != null && (
                <span className="absolute right-2 top-1.5 rounded-full bg-warn px-1.5 py-px text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface px-4 py-3.5 sm:gap-4 sm:px-7 sm:py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold text-ink sm:text-lg">{title}</h1>
          {meta}
        </div>
        {subtitle && (
          <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function UserChip({
  name,
  sub,
  dark = true,
}: {
  name: string;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          dark ? "bg-nav-hover text-nav-text-active" : "bg-primary-soft text-primary-text"
        }`}
      >
        {name.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <div
          className={`truncate text-xs font-medium ${
            dark ? "text-nav-text-active" : "text-ink"
          }`}
        >
          {name}
        </div>
        {sub && (
          <div
            className={`truncate text-[10px] ${
              dark ? "text-nav-text" : "text-ink-muted"
            }`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
