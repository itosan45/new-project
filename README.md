# new-project

Claude Code を「秘書」窓口とした個人用の仮想組織の土台。

- `CLAUDE.md`: 運用ルール（秘書が唯一の窓口／自動記録／追記のみ／inbox）
- `secretary/`: 窓口。`inbox/`（判断保留）、`logs/`（日次自動記録）
- `departments/`: 部署ごとのフォルダ（`creator`, `engineer`, `web-designer`。増減自由）
- `docs/prompts.md`: 土台構築・フィードバック反映用のプロンプトテンプレート
- `webapp/`: スマホから閲覧・追記するためのWebアプリ（詳しくは `webapp/README.md`）
- `ocr-app/`: 手書き書類をスマホで撮って読み取るOCRアプリ（詳しくは `ocr-app/README.md`）
- `notes/` `decisions/` `tasks/` `outputs/` `references/`: 思いつき・決定・作業・
  成果物・根拠を1ファイル1件で記録する場所
- `graph/`: 上記と `secretary/` `departments/` のつながりを自動でまとめた
  「地図」。作り直すコマンドは `npm run graph`（詳しくは `graph/README.md`）

部署の役割は各 `departments/<部署名>/README.md` に、`CLAUDE.md` の「部署一覧」にも追記して整合させる。
