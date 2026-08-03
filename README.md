# new-project

Claude Code を「秘書」窓口とした個人用の仮想組織の土台。

- `CLAUDE.md`: 運用ルール（秘書が唯一の窓口／自動記録／追記のみ／inbox）
- `secretary/`: 窓口。`inbox/`（判断保留）、`logs/`（日次自動記録）
- `departments/`: 部署ごとのフォルダ（`marketing`, `research`, `finance` はサンプル。増減自由）
- `docs/prompts.md`: 土台構築・フィードバック反映用のプロンプトテンプレート

部署の役割は各 `departments/<部署名>/README.md` に、`CLAUDE.md` の「部署一覧」にも追記して整合させる。
