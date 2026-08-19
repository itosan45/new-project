---
title: 提案書は合議でつくる。集約役のAgentを1体置く
tags: [ハーネス, 組織設計, engineer]
basedOn: [decisions/2026-08-19-hearing-and-proposal-repeat.md]
---

## きっかけ

「顧客の希望 → 各エージェントのアイデア・意見・懸念点 の提案書を作成する
専門エージェントもほしい」

## 決めたこと

`proposal-architect`（提案設計 Agent）を追加した。17体目。

顧客の希望をそのまま提案書にすると、できない約束が混ざる。
提案書を書く前に各Agentへ意見照会し、返ってきたものを集約して組み立てる。

| 集めるもの | 提案書のどこになるか |
|---|---|
| こうすればできる（ideas） | やること |
| うちでは無理（cannotDo） | **やらないこと** |
| ここが危ない（concerns） | 前提条件 / 承認ゲートの設計 |
| できる・条件つき・できない（feasibility） | 受けるかどうかの判断材料 |

## 誰の意見かを必ず残す

`AgentOpinion.agentId` で、意見を出したAgentを記録する。
匿名の箇条書きにすると、後で「この懸念は誰が言ったのか」を追えなくなり、
責任の所在が消える。

## 答えていない懸念があるうちは提案を出せない

`concerns` には答え（`answer`）の欄がある。
未回答の懸念が残っている状態では、段階を進められないようにした。
答えていない懸念は、制作か納品のどちらかで必ず表に出てくる。

## この Agent にやらせないこと

`forbiddenActions` に入れたもの:

- 金額の確定（根拠は出すが、決めるのは人）
- 顧客への送付
- 懸念の削除
- 意見を出したAgent名の伏せ字化

集約役が金額まで決められると、誰も止められなくなる。
また、懸念が多いことを理由に案件を却下することも担当外にした。
判断はあくまで人が持つ。

## 実装

`harness/lib/data/agents.ts` の `proposal-architect`、
`harness/lib/domain/engagement.ts` の `AgentOpinion` / `AgentConcern` /
`unansweredConcerns()`。
