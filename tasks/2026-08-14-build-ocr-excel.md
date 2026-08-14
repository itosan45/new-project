---
title: 画像・PDF → Excel 自動入力の仕組みを作る
status: done
partOf: decisions/2026-08-14-ocr-drive-not-vision-api.md
tags: [OCR, engineer]
---

Google Drive の読み取り結果を受け取り、設定ファイルで指定した項目
(日付・金額・宛名・電話番号など)を Excel の指定した列に書き込む
仕組みを `ocr-excel/` に構築する。抽出ロジックとExcel書き込みには
テストをつける。
