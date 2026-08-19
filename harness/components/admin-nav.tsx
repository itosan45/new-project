import type { NavItem } from "@/components/shell";

/** 管理者側の共通ナビ。運用センターとライブ実行トレースで同じものを使う。 */
export const ADMIN_NAV: NavItem[] = [
  { label: "ダッシュボード", href: "/admin", icon: "grid" },
  { label: "エージェント管理", href: "/admin/agents", icon: "robot" },
  { label: "ワークフロー", href: "/admin/workflows", icon: "flow" },
  { label: "ライブ実行", href: "/admin/live", icon: "play" },
  { label: "実行履歴", href: "/admin/runs", icon: "history" },
  { label: "承認センター", href: "/admin/approvals", icon: "check", badge: 12 },
  { label: "データコンテキスト", href: "/admin/context", icon: "database" },
  { label: "ナレッジベース", href: "/admin/knowledge", icon: "book" },
  { label: "コネクタ管理", href: "/admin/connectors", icon: "plug" },
  { label: "ガバナンス", href: "/admin/governance", icon: "shield" },
  { label: "アラート", href: "/admin/alerts", icon: "alert", badge: 3 },
  { label: "レポート", href: "/admin/reports", icon: "chart" },
  { label: "設定", href: "/admin/settings", icon: "settings" },
];
