/**
 * 読み取った文字から、日付・金額などの項目を取り出す。
 *
 * 元は `ocr-excel/lib/抽出.py`。同じ規則をこちらへ移した。
 * ハーネスは Vercel（Node）で動くので Python を呼べない。
 *
 * 2か所に同じ規則があるので、**ずれると事故になる**。
 * 対策として、Python 側のテストと同じケースを
 * `extract.test.ts` にそのまま置いてある。片方だけ直すと落ちる。
 *
 * ここは OCR ではない。画像から文字を読むのは外（スキャナやGoogleドライブ）で、
 * 受け取るのは読み取り済みの全文。ocr-excel も同じ前提で作ってある。
 */

// 2026/8/12, 2026-08-12, 2026年8月12日 など
const 西暦パターン = /(\d{4})\s*[/\-年]\s*(\d{1,2})\s*[/\-月]\s*(\d{1,2})\s*日?/g;
// 令和8年8月12日
const 令和パターン = /令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;

/**
 * ありえない年は日付として採らない。
 *
 * これが無いと「0532-11-2222」（電話番号）を
 * 0532年11月22日として読む。実際にそうなっていた。
 */
const 年の下限 = 1900;
const 年の上限 = 2100;

// ¥1,234 / 1,234円。小数は扱わない（日本円想定）
const 金額パターン = /[¥￥]\s*([0-9][0-9,]*)|([0-9][0-9,]*)\s*円/g;

// 03-1234-5678 / 090-1234-5678 / 0312345678
const 電話パターン = /0\d{1,4}[-(）\s]?\d{1,4}[-)）\s]?\d{3,4}/;

/**
 * 最初に見つかった「まともな」日付を YYYY-MM-DD で返す。無ければ空文字。
 *
 * 見つかった順に1件目を返すのではなく、条件に合う最初のものを返す。
 * 電話番号や整理番号が先に当たることがあるため。
 */
export function 日付を探す(文字列: string): string {
  for (const { パターン, 令和 } of [
    { パターン: 西暦パターン, 令和: false },
    { パターン: 令和パターン, 令和: true },
  ]) {
    for (const m of 文字列.matchAll(パターン)) {
      let 年 = Number(m[1]);
      const 月 = Number(m[2]);
      const 日 = Number(m[3]);
      if (令和) 年 += 2018;
      if (年 < 年の下限 || 年 > 年の上限) continue;
      // ありえない月日は拾わない。読み違えの可能性が高い
      if (!(月 >= 1 && 月 <= 12 && 日 >= 1 && 日 <= 31)) continue;
      return `${String(年).padStart(4, "0")}-${String(月).padStart(2, "0")}-${String(日).padStart(2, "0")}`;
    }
  }
  return "";
}

/** 見つかった金額のうち一番大きいものを返す。合計額であることが多いため。 */
export function 金額を探す(文字列: string): string {
  const 一覧: number[] = [];
  for (const m of 文字列.matchAll(金額パターン)) {
    const 数字 = m[1] ?? m[2];
    if (!数字) continue;
    const n = Number(数字.replace(/,/g, ""));
    if (Number.isFinite(n)) 一覧.push(n);
  }
  return 一覧.length > 0 ? String(Math.max(...一覧)) : "";
}

export function 電話番号を探す(文字列: string): string {
  return 文字列.match(電話パターン)?.[0].trim() ?? "";
}

/** 末尾の「様」「御中」などを取り除く。宛名として使いやすくするため。 */
export function 敬称を落とす(値: string): string {
  for (const 敬称 of ["様", "さま", "サマ", "さん", "御中", "殿"]) {
    if (値.endsWith(敬称)) return 値.slice(0, -敬称.length).trim();
  }
  return 値;
}

/**
 * 手がかりの言葉の右側、または次の行にある値を返す。
 * 「宛名: 山田太郎」も「宛名\n山田太郎」も拾う。
 */
export function キーワードで探す(文字列: string, 手がかり一覧: string[]): string {
  const 行一覧 = 文字列.split("\n").map((行) => 行.trim());
  for (let i = 0; i < 行一覧.length; i++) {
    for (const 手がかり of 手がかり一覧) {
      if (!行一覧[i].includes(手がかり)) continue;
      const 右側 = 行一覧[i]
        .split(手がかり)
        .slice(1)
        .join(手がかり)
        .replace(/^[ :：　|｜]+|[ :：　|｜]+$/g, "");
      if (右側) return 敬称を落とす(右側);
      if (i + 1 < 行一覧.length && 行一覧[i + 1]) return 敬称を落とす(行一覧[i + 1]);
    }
  }
  return "";
}
