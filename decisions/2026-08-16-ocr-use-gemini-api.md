---
title: 手書きOCRアプリのAPIをClaude APIからGemini APIに切り替える
tags: [OCR, 判断, engineer]
basedOn: [decisions/2026-08-16-ocr-use-claude-api-vision.md]
supersedes: decisions/2026-08-16-ocr-use-claude-api-vision.md
---

## 決めたこと

`ocr-app/` の読み取りエンジンを、Claude API(claude-opus-5)から
Gemini API(gemini-2.5-pro)に変更する。

## 理由

セットアップ(AnthropicのAPIキー発行・Vercelへの環境変数設定)を
進めている途中で、ユーザーがGemini APIへの切り替えを希望した。
Gemini APIもClaude API同様のLLM方式のvisionで、崩れた手書きを
文脈から推測して読む能力は同等クラス。DocumentForce級の精度を
出す、という要件は変わらず満たせる。

Claude APIとの技術選定はほぼ横並びで、どちらでも要件は満たせるため、
ユーザーの意向を優先した。

## 影響

- `ocr-app/app/api/ocr/route.ts` の実装を `@anthropic-ai/sdk` から
  `@google/genai` に差し替え
- APIキーの発行元が console.anthropic.com → aistudio.google.com/apikey に変わる
- 環境変数名が `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` に変わる
- 抽出項目・プロンプトの内容・UI・CSV出力形式は変更なし
