---
title: 書類→Excel転記ツール 友人配布版
artifactId: ocr-excel-friend-kit
version: 1
partOf: tasks/2026-08-14-build-ocr-excel.md
tags: [OCR, engineer, 配布]
---

`ocr-excel/友人配布用/` に作成。ChatGPTとCodexを使う友人が毎日使えるよう、
セットアップの重さを段階的に選べる形にした。

- `転記.py` … 1ファイル完結。依存は openpyxl のみ。APIも通信も不要
- `ChatGPT用プロンプト.md` … 貼り付けて写真を添付するだけ。インストール不要
- `Codex用プロンプト.md` … パソコン上にフォルダ監視まで組む場合の指示書
- `README.md` … どちらを使うべきかの案内

抽出ロジックは本体と同一で、実データ相当のテストで動作確認済み。
