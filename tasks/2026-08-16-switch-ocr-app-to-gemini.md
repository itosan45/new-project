---
title: ocr-appの読み取りエンジンをGemini APIに切り替える
status: done
partOf: decisions/2026-08-16-ocr-use-gemini-api.md
tags: [OCR, engineer]
---

`ocr-app/app/api/ocr/route.ts` を `@anthropic-ai/sdk` から `@google/genai`
(モデル: gemini-2.5-pro)に差し替える。抽出項目(書類の種類・日付・金額・
宛名・電話番号・全文・読み取りメモ)とプロンプトの内容は維持し、
structured output(JSON Schema)・エラーハンドリング(APIキー不正・
レート制限・その他)もGemini SDKの形に合わせて書き換える。

`.env.example` / `ocr-app/README.md` の環境変数名・APIキー発行手順も
Gemini向けに更新する。
