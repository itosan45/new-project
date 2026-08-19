---
title: 仕事の流れ（6段階）を型と画面に落とす
tags: [ハーネス, engineer]
partOf: [decisions/2026-08-19-engagement-six-stages.md, decisions/2026-08-19-hearing-and-proposal-repeat.md, decisions/2026-08-19-proposal-architect-agent.md]
---

## やったこと

- `harness/lib/domain/engagement.ts`
  案件の型。段階・侵襲度・引合元・打ち合わせ（回ごと）・提案（版ごと）・
  Agentの意見・成果物・インシデント・遷移記録。
  進める条件は `checkGate()` が案件のデータを見て返す。
- `harness/lib/data/stages.ts`
  各段階で秘書・Agent・あなたが何をするか。
  相談と提案には「1回ぶんの手順」を持たせた。
- `harness/lib/data/agents.ts`
  `proposal-architect` を追加（17体目）。
- `harness/app/flow/page.tsx`
  画面（`/flow`）。進める条件は文章で書かず、`checkGate()` の結果を表示している。
  説明と実装がずれないようにするため。
- `harness/lib/domain/engagement.test.ts`
  検証10件。既存の承認ゲート8件と合わせて18件。

## 確かめたこと

型チェック・lint・テスト18件・本番ビルド、いずれも通過。
画面はブラウザで表示を確認（横スクロールなし、コンソールエラーなし）。

## まだやっていないこと

- 案件（Engagement）の保存。いまは型と画面だけで、`lib/store/` が無い。
  案件（Run）の保存と同じく GitHub のファイルに置く予定。
- `/flow` は設計を見る画面で、実際の案件を進める画面はまだ無い。
