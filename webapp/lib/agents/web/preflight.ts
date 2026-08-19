import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import type { WebBrief } from "@/lib/domain/web-project";

/**
 * 公開前チェック Agent。
 *
 * 判定するだけで、公開はしない。
 * フォームの送信先が決まっていなければ公開不可にする。
 * 問い合わせが誰にも届かないまま公開すると、来た仕事をそのまま失い、
 * しかも気づくのが数週間後になる。
 */

export interface PreflightOutput {
  公開してよいか: "公開できる" | "公開できない";
  止めている理由: string[];
  公開前にやること: string[];
  公開直後に確かめること: string[];
}

export function preflight(brief: WebBrief): PreflightOutput | { missing: string[] } {
  const missing: string[] = [];
  if (!brief.hosting.value || brief.hosting.value === "未定")
    missing.push("置き場所（hosting）");
  if (!brief.domain.value?.trim()) missing.push("ドメイン（domain）");
  if (missing.length > 0) return { missing };

  const blockers: string[] = [];
  const before: string[] = [];

  // ここが最重要。空なら公開させない
  if (!brief.form.value?.trim()) {
    blockers.push(
      "問い合わせフォームの送信先が決まっていない。このまま公開すると、来た問い合わせが誰にも届かない",
    );
  }

  if (/作り直し|リニューアル|既存/.test(brief.existingSite.value ?? "")) {
    before.push(
      "旧サイトのURLと新URLの対応表を作る。作らないと検索から来ていた人が全員行き止まりになる",
    );
  }

  before.push(
    "検索避けの設定を外したか確認する（外し忘れると、いつまでも検索に出ない）",
    "テスト用の仮の文章が残っていないか、全ページを見る",
    "スマホの実機で見る。PCの縮小表示では気づけない崩れがある",
    "表示速度を測る（LCP 2.5秒以下・INP 200ミリ秒以下・CLS 0.1以下）",
  );

  return {
    公開してよいか: blockers.length === 0 ? "公開できる" : "公開できない",
    止めている理由: blockers,
    公開前にやること: before,
    公開直後に確かめること: [
      "自分のスマホから、実際に問い合わせを1件送る。設定が正しくても迷惑メールに入ることがある",
      "主導線のボタンを、実際に押して最後まで進む",
      "計測が動いているか、自分のアクセスが記録されるかを見る",
    ],
  };
}

export const webPreflightAgent: AgentImpl = {
  agentId: "web-preflight",
  run(ctx): AgentResult {
    if (!ctx.brief) return needsInput(["Web制作の設計内容（WebBrief）"], "自分");

    const result = preflight(ctx.brief);
    if ("missing" in result) return needsInput(result.missing);

    return {
      status: "完了",
      summary:
        result.公開してよいか === "公開できる"
          ? `公開できる（公開前の作業 ${result.公開前にやること.length}件）`
          : `公開できない（${result.止めている理由.length}件）`,
      output: result,
      evidence: [
        `置き場所: ${ctx.brief.hosting.value}`,
        `ドメイン: ${ctx.brief.domain.value}`,
        ctx.brief.form.value?.trim()
          ? `フォーム送信先: ${ctx.brief.form.value}`
          : "フォーム送信先が未設定のため公開不可と判定",
      ],
    };
  },
};
