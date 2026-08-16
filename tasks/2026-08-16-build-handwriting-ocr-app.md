---
title: 手書きOCRアプリ(ocr-app)を構築する
status: done
partOf: decisions/2026-08-16-ocr-use-claude-api-vision.md
tags: [OCR, engineer]
---

スマホで手書き書類を撮影 → Claude API(vision)で読み取り →
項目(書類の種類・日付・金額・宛名・電話番号・全文)を構造化して表示 →
CSVダウンロード、までを1画面で行うNext.jsアプリを `ocr-app/` に構築する。

- 既存 `webapp/` と同じスタック(Next.js 16 / React 19 / Tailwind 4)と
  1パスワード認証を踏襲
- Vercelに Root Directory = `ocr-app` でデプロイする想定
- 抽出項目は `ocr-excel/設定.yaml` の項目構成を踏襲
