---
title: 業務自動化ハーネス 開発環境 v1
artifactId: harness
version: 1
partOf: decisions/2026-08-14-personas-drive-the-design.md
tags: [ハーネス, engineer]
---

`harness/` に構築。Next.js 16 + TypeScript + Tailwind。

## 画面(5種、全てブラウザで表示確認済み・エラーゼロ)

- `/` 画面一覧(開発用の入口)
- `/tenants` 仮想顧客3社とペルソナ9名
- `/employee` お仕事コックピット
- `/ceo` CEOアシスタント
- `/admin` エージェント運用センター
- `/admin/live` ライブ実行トレース

## 骨組み

`lib/domain/types.ts` に Run / AgentContract / ApprovalRequest /
Artifact / AuditEvent / SavingMetric を定義。画面はこの型だけを読む。
データは `lib/data/` の固定値だが、型は本番と同じなので供給元を
差し替えれば画面は変えずに動く。

設計書のルールのうち事故に直結するものは型に埋め込んだ。
`ApprovalRequest.reason` 必須、Approval Agent の禁止操作に「承認の代行」、
`RunStatus` 10種の色分離、`SavingMetric.basis` 必須など。

チャートとアイコンは外部ライブラリを使わずSVGで自前実装。
