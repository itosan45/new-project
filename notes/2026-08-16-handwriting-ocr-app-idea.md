---
title: 下手な手書き文字でも読めるOCRを内製アプリ化したい
tags: [OCR, アイデア, engineer]
---

手書きの下手くそな文字でも読み取れるOCRアプリを内製したい。
ベンチマークは DocumentForce(references/2026-08-16-documentforce-benchmark.md)。

既存の `ocr-excel/`(Google Drive読み取り)は活字・きれいな手書きには使えるが、
崩れた手書きに弱く、秘書経由の手動運用になっている。スマホで撮って
その場で読み取れる完全自動のアプリにしたい。
