import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import type { IaOutput } from "@/lib/agents/web/ia";
import type { EstimateOutput } from "@/lib/agents/web/estimate";
import type { MeasureOutput } from "@/lib/agents/web/measure";
import type { PreflightOutput } from "@/lib/agents/web/preflight";
import type { WebBrief } from "@/lib/domain/web-project";

/**
 * 提案書作成 Agent。
 *
 * ここが**成果物が出てくる場所**。
 * これまでハーネスは記録しか出しておらず、実物は秘書が手で作っていた。
 *
 * 前のAgentが出したものを組み立てるだけで、新しい事実は作らない。
 * 分かっていないことは「未確定」と書く。埋めない。
 * 未確定が残っている提案書は、**顧客に出せない**と判定する。
 */

export interface ProposalOutput {
  /** 提案書そのもの（Markdown） */
  document: string;
  /** ファイル名の案 */
  fileName: string;
  /** まだ決まっていないもの */
  undecided: string[];
  /** 顧客に出せる状態か */
  readyForClient: boolean;
}

function line(label: string, value: string | undefined, undecided: string[]): string {
  if (value && value.trim()) return `| ${label} | ${value} |`;
  undecided.push(label);
  return `| ${label} | **（未確定）** |`;
}

export function writeProposal(
  brief: WebBrief,
  prior: Record<string, unknown>,
  clientName = "",
): ProposalOutput | { missing: string[] } {
  const ia = prior["web-ia"] as IaOutput | undefined;
  const est = prior["web-estimate"] as EstimateOutput | undefined;
  const measure = prior["web-measure"] as MeasureOutput | undefined;
  const pre = prior["web-preflight"] as PreflightOutput | undefined;

  const missing: string[] = [];
  if (!ia) missing.push("情報設計の結果（先に情報設計Agentを通す）");
  if (!est) missing.push("工数の結果（先に工数見積Agentを通す）");
  if (missing.length > 0) return { missing };

  const undecided: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const name = clientName.trim() || "（顧客名）";

  const rows = [
    line("狙い", brief.goal.value, undecided),
    line("見る人", brief.persona.value, undecided),
    line("してほしい行動", brief.primaryAction.value, undecided),
    line("作り方", brief.buildStyle.value, undecided),
    line("置き場所", brief.hosting.value, undecided),
    line("独自ドメイン", brief.domain.value, undecided),
    line("文章と写真", brief.content.value, undecided),
    line("公開後の更新", brief.updates.value, undecided),
    line("公開希望日", brief.deadline.value, undecided),
  ].join("\n");

  /*
   * 用途の分からないページが残っているのに「出せる」と判定していた。
   * 分からないまま顧客に出すと、その欄でそのまま揉める。
   */
  for (const p of ia!.pages) {
    if (p.purpose.includes("確認する")) undecided.push(`${p.name} の用途`);
  }

  const pages = ia!.pages
    .map((p) => `| ${p.name} | ${p.purpose} | ${p.hasMainAction ? "○" : "－"} |`)
    .join("\n");

  const breakdown = est!.内訳
    .map((l) => `| ${l.項目} | ${l.人日} | ${l.根拠} |`)
    .join("\n");

  const doc = `# ご提案 — ${name} 様

作成日: ${today}

## 1. このサイトで目指すこと

| 項目 | 内容 |
|---|---|
${rows}

${undecided.length > 0 ? `> **未確定が ${undecided.length} 件あります。** この提案書はまだ社内用です。\n> 次の打ち合わせで確かめてから、お出しします。\n` : "> 未確定はありません。\n"}
## 2. ページ構成

| ページ | 目的 | 主導線 |
|---|---|---|
${pages}

主導線は「**${ia!.actionLabel}**」の1つに絞ります。2つ以上置くと、どちらも押されなくなります。

置き場所:
${ia!.actionPlacement.map((p) => `- ${p}`).join("\n")}

## 3. 作業量

| 内訳 | 人日 | 根拠 |
|---|---|---|
${breakdown}

**合計 ${est!.下振れ}〜${est!.上振れ} 人日**

金額はこの提案書では出していません。作業量と根拠のみです。

### この見積が崩れる条件

${est!.崩れる条件.map((c) => `- ${c}`).join("\n")}

## 4. やらないこと

- 写真の撮影（素材のご用意をお願いします）
- 動画の制作（埋め込みは含みます）
- ロゴの制作・商標登録
- 独自ドメインの購入手続き（空き確認と支払いページの発行までは行います）
- DNSの設定
- 検索順位の保証
- 広告の運用

${
  measure
    ? `## 5. 効果の測り方

- 数えるもの: ${measure.数えるもの}
- 数える場所: ${measure.数える場所}
- 公開前の基準値: ${measure.基準値}
- 評価時期: ${measure.評価時期}

${measure.注意.map((n) => `- ${n}`).join("\n")}
`
    : `## 5. 効果の測り方

**（未確定）** いまの件数をうかがってから決めます。
公開前の数字が無いと、あとで「増えました」と言えなくなります。
`
}
${
  pre
    ? `## 6. 公開前に必要なこと

判定: **${pre.公開してよいか}**

${pre.止めている理由.length > 0 ? pre.止めている理由.map((r) => `- ⚠ ${r}`).join("\n") + "\n" : ""}
${pre.公開前にやること.map((r) => `- ${r}`).join("\n")}
`
    : `## 6. 公開前に必要なこと

**（未確定）** 置き場所とドメインが決まってから出します。
`
}
---

この提案書は、ヒアリングでうかがった内容から自動で組み立てています。
未確定の欄は、こちらで推測せずに空けてあります。
`;

  return {
    document: doc,
    fileName: `提案書_${name.replace(/[\s　/\\]/g, "")}_${today}.md`,
    undecided,
    readyForClient: undecided.length === 0,
  };
}

export const webProposalAgent: AgentImpl = {
  agentId: "web-proposal",
  run(ctx): AgentResult {
    if (!ctx.brief) return needsInput(["Web制作の設計内容（WebBrief）"], "自分");

    const r = writeProposal(ctx.brief, ctx.prior ?? {}, ctx.clientName);
    if ("missing" in r) return needsInput(r.missing, "自分");

    if (!r.readyForClient) {
      // 未確定を含む提案書は、そのまま出せない
      return {
        status: "人に回す",
        summary: `提案書を作りました。ただし未確定が${r.undecided.length}件あります（社内用）`,
        output: r,
        evidence: [
          "情報設計と工数の結果から組み立てた",
          "新しい事実は作っていない。分からない欄は空けてある",
          `未確定: ${r.undecided.join("・")}`,
        ],
        reason: [
          `未確定が${r.undecided.length}件あるため、このままでは顧客に出せません`,
          ...r.undecided.map((u) => `${u} が決まっていない`),
        ],
      };
    }

    return {
      status: "完了",
      summary: "提案書を作りました。顧客に出せる状態です",
      output: r,
      evidence: [
        "情報設計と工数の結果から組み立てた",
        "新しい事実は作っていない",
        "未確定なし",
      ],
    };
  },
};
