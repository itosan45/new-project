import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ApiError, FinishReason } from "@google/genai";
import type { OcrResult } from "@/lib/ocr";

// 手書き読み取りは時間がかかることがあるため、関数の実行時間を延ばす
export const maxDuration = 300;

const MODEL = "gemini-2.5-pro";

// リクエストボディ(base64)のサイズ上限。Vercelの関数ボディ上限(約4.5MB)対策
const MAX_BASE64_LENGTH = 5_500_000;

const IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number];

const SYSTEM_PROMPT = `あなたは日本語書類の読み取り(OCR)の専門家です。
送られてくるのは、スマホで撮影した書類の写真やPDFです。手書きの文字が
非常に崩れていることがありますが、文字の形だけでなく書類の文脈
(書類の種類、前後の語、日本の住所・氏名・金額の慣習)から総合的に推測して、
できる限り読み取ってください。

- 全文は、レイアウトのまとまりごとに改行して書き起こす
- 日付は YYYY-MM-DD に正規化する(令和などの和暦は西暦に変換)。無ければ空文字
- 金額は数字のみ(カンマ・円・¥を除く)。複数ある場合は合計とみなせる最大額。無ければ空文字
- 宛名は「様」「御中」などの敬称を除いた名前。無ければ空文字
- 電話番号は 03-1234-5678 のような形式。無ければ空文字
- どうしても読めない文字は「?」と書き、その箇所と推測候補を読み取りメモに書く
- 推測に自信がない読みも、読み取りメモに「◯◯は△△の可能性あり」と書く`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    docType: {
      type: "string",
      description: "書類の種類(例: 領収書、注文書、請求書、手紙、メモ)",
    },
    date: { type: "string", description: "書類の日付。YYYY-MM-DD。無ければ空文字" },
    amount: { type: "string", description: "金額(数字のみ)。無ければ空文字" },
    addressee: { type: "string", description: "宛名(敬称なし)。無ければ空文字" },
    phone: { type: "string", description: "電話番号。無ければ空文字" },
    fullText: { type: "string", description: "書き起こした全文" },
    note: {
      type: "string",
      description: "読めなかった箇所・推測に自信がない箇所のメモ。無ければ空文字",
    },
  },
  required: ["docType", "date", "amount", "addressee", "phone", "fullText", "note"],
  additionalProperties: false,
} as const;

function isImageMediaType(value: string): value is ImageMediaType {
  return (IMAGE_MEDIA_TYPES as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "サーバーに GEMINI_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const mediaType = typeof body?.mediaType === "string" ? body.mediaType : "";
  const data = typeof body?.data === "string" ? body.data : "";

  if (!data) {
    return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
  }
  if (data.length > MAX_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "ファイルが大きすぎます(4MB以下にしてください)" },
      { status: 413 }
    );
  }
  if (mediaType !== "application/pdf" && !isImageMediaType(mediaType)) {
    return NextResponse.json(
      { error: `対応していないファイル形式です: ${mediaType}` },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: mediaType, data } },
        { text: "この書類を読み取り、指定の形式で項目を抽出してください。" },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: OUTPUT_SCHEMA,
      },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    if (
      finishReason === FinishReason.SAFETY ||
      finishReason === FinishReason.PROHIBITED_CONTENT ||
      finishReason === FinishReason.BLOCKLIST ||
      finishReason === FinishReason.SPII
    ) {
      return NextResponse.json(
        { error: "この内容は読み取りできませんでした(安全上の理由)" },
        { status: 422 }
      );
    }
    if (finishReason === FinishReason.MAX_TOKENS) {
      return NextResponse.json(
        { error: "書類が長すぎて読み取りが途中で切れました。分割して撮影してください" },
        { status: 422 }
      );
    }

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "読み取り結果を取得できませんでした" },
        { status: 502 }
      );
    }

    const result = JSON.parse(text) as OcrResult;
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { error: "APIキーが無効です。Vercelの環境変数 GEMINI_API_KEY を確認してください" },
          { status: 500 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "アクセスが集中しています。少し待ってからやり直してください" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `読み取りに失敗しました (${error.status}): ${error.message}` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "読み取りに失敗しました。通信環境を確認してやり直してください" },
      { status: 502 }
    );
  }
}
