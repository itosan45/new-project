# virtual-org webapp

`secretary/` `secretary/inbox` `secretary/logs` `departments/` をスマホから
閲覧・追記するための、GitHub API連携のNext.jsアプリ。

- ファイルの読み書きはすべて GitHub の Contents API 経由(サーバーサイドの
  Personal Access Tokenを使用)。ローカルにgitクローンを持つ必要はない。
- 1つのパスワードでログインし、以降はCookieセッションで保護される
  (`proxy.ts`)。
- 追記はすべて `CLAUDE.md` のルール通り: 既存ファイルは上書きせず、
  同日ログ/notesファイルがあれば追記する。

## セットアップ

```bash
cd webapp
npm install
cp .env.example .env.local
```

`.env.local` に以下を設定する:

- `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH`: 対象リポジトリ
- `GITHUB_TOKEN`: `contents: write` 権限を持つ GitHub Personal Access Token
  (fine-grained PAT を対象リポジトリのみに絞るのを推奨)
- `APP_PASSWORD`: アプリのログインパスワード(自分専用)

```bash
npm run dev
```

## Vercelへのデプロイ

1. このリポジトリをVercelにインポートし、Root Directory を `webapp` に設定する
2. Project Settings → Environment Variables に `.env.example` と同じ4つの
   環境変数を設定する
3. Deploy

デプロイ後、スマホのブラウザでアプリのURLを開き、ホーム画面に追加すると
アプリのように使える。
