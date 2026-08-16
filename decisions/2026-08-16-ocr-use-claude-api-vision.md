---
title: 手書きOCRアプリはClaude APIのvision機能で内製する
tags: [OCR, 判断, engineer]
basedOn: [notes/2026-08-16-handwriting-ocr-app-idea.md, references/2026-08-16-documentforce-benchmark.md]
---

## 決めたこと

崩れた手書き文字も読めるOCRアプリを、Claude API のvision機能
(モデル: claude-opus-5)を使って `ocr-app/` に内製する。
AnthropicのAPIキーを取得し、Vercelの環境変数に設定して運用する。
出力は画面表示+CSVダウンロード(BOM付きUTF-8、Excelにそのまま貼れる形)。

## 理由

- DocumentForce級の「下手な手書きでも読める」精度は、LLMのvision能力に
  よるもの。Google Driveの読み取り(2026-08-14の決定)は活字には十分だが、
  崩れた手書きには太刀打ちできない。
- APIキーはVercelに1回設定するだけで済み、以降はスマホから完全自動で使える。
  Google Cloud Vision APIのような多段の認証設定は不要。
- コストは従量課金で写真1枚あたり数円程度。DocumentForceの3円〜/解析と同水準。
- 2026-08-16 にユーザーへ確認し、APIキー取得を承認済み。

## 2026-08-14の決定との関係

「OCRはDriveの読み取りを使う」(decisions/2026-08-14-ocr-drive-not-vision-api.md)
を上書きするものではなく、用途で使い分ける:

- 活字・きれいな書類を秘書経由でまとめてExcel化 → 既存 `ocr-excel/`(Drive)
- 崩れた手書きをスマホでその場で読む → 新規 `ocr-app/`(Claude API)

## 影響

- AnthropicのAPIキー取得と、少額の従量課金が発生する
- スマホ単体で完結する初めてのOCR手段ができる(秘書を介さない)
