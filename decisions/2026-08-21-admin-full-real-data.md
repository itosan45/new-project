# /adminの残りもすべて実データ化する

日付: 2026-08-21

## 決めたこと

前回（2026-08-20）は上4枚のKPIだけを実データにした。今回、残っていた
3つのセクションもすべて `cases/` 配下の実案件から算出する形に置き換えた。

| セクション | 前 | 後 |
|---|---|---|
| ワークフロー健康状態 | `marketing-research→data-analyst→executor→qa` という**存在しない**4体の固定フロー。処理数・成功率も決め打ち | 廃止。下の「Agentの稼働状況」に統合 |
| 承認待ちキュー | 3件の作り話の承認要求（マーケティング調査レポート等） | `cases/` の実際のPENDING承認要求。0件なら「いま承認待ちの案件はありません」 |
| 自動化効果の推移 | 5/1〜5/30の8点の作り話の日次グラフ。削減コスト（万円）は根拠のない円換算 | 実際の案件を日付ごとに集計した折れ線。案件が無ければ「まだ案件がありません」、1日分しか無ければ「推移を描けるほどの日数がまだありません」 |
| エージェント活動状況 | 11体の固定運用エージェント（Marketing Research, Data Analyst 等）の決め打ちの処理数・成功率 | `lib/agents/registry.ts` に実装がある8体（Document Reader, Classifier, Web制作6体）の実際の完了件数 |

## なぜワークフロー健康状態を丸ごとやめたか

このセクションが表示していた4体（marketing-research, data-analyst,
executor, qa）は、**どれも実装が無い**。実在するのはDocument Reader と
Classifier、Web制作の6体だけで、しかもこれらは1つの「フロー」ではなく
テナントごとに違う工程を通る（三河ハウスは
intake→document-reader→validator→approval→executor→audit、
ルミエールはintake→classifier→draft-writer→...→executor、と別物）。

存在しない4体を1本の矢印でつないで「フロー」と称するのは、実装が無い
ことと同じくらい不誠実だと判断し、セクションごと廃止して、実際に実装が
ある8体の一覧（Agentの稼働状況）に一本化した。

## 円換算・前日比をやめた理由（KPI作業のときと同じ）

自動化効果の推移グラフから「削減コスト（万円）」を完全に削除した。
時間単価の根拠がどこにも無いため。件数と削減時間（時間）だけを見せる。
前日比の矢印も、比較対象の「昨日の値」を保存していないため付けない。

## 「成功率」ではなく「完了 / 登場」の件数をそのまま出す

Agentの稼働状況は、成功率（%）ではなく「累計完了 / 登場」の件数を
そのまま出す。実装したてのAgentは分母が小さく、1件失敗しただけで
％が大きく振れて意味を持たない。件数ならその小ささごと正直に伝わる。

## 死んだ固定データを削除した

`lib/data/workspace.ts` の `ADMIN_KPIS` `ADMIN_APPROVAL_QUEUE`
`AUTOMATION_TREND` `ADMIN_TREND_SUMMARY` `WORKFLOW_HEALTH_ORDER`、
`lib/data/agents.ts` の `AGENT_RUNTIME` を削除した。使われなくなった
作り話のデータをコードに残すと、いつか別の画面から再配線されて
同じ問題が戻ってくる。

`lib/domain/operator.test.ts` の「架空の担当者を置かない」テストが
`AGENT_RUNTIME` を見ていたため、該当箇所を削除して調整した
（`AGENT_CONTRACTS` 側のチェックは残っている）。

## 追加した集計関数（`lib/store/cases.ts`）

- `pendingApprovalsOf(records)`: 複数案件の承認要求を1つに平らにする
- `summarizeAgentActivity(records, today)`: Agentごとの完了件数・本日の完了件数・最終完了日時
- `summarizeByDay(records, minutesPerCase)`: 日付ごとの件数と削減時間。**架空の日を埋めない**（案件が無い日は単に配列に現れない）

いずれもテスト（`lib/store/cases.test.ts`）で、実際に `startCase()` を
通した案件から正しく集計できることを確認している。
