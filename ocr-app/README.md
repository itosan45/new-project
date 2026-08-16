# 手書きOCRアプリ (ocr-app)

手書きの書類をスマホで撮影すると、崩れた文字でも読み取って
「書類の種類・日付・金額・宛名・電話番号・全文」に整理し、
CSVでダウンロードできるNext.jsアプリ。

読み取りには Claude API のvision機能(モデル: claude-opus-5)を使う。
ベンチマークは DocumentForce(references/2026-08-16-documentforce-benchmark.md)。

- 画像はスマホ側で自動的に縮小(長辺2576px・JPEG)してから送るので、
  通信量・読み取りコストが抑えられる
- PDF(4MBまで)もそのまま読み取れる
- 1パスワードでログインし、以降はCookieセッションで保護(`proxy.ts`)。
  APIキーが他人に使われるのを防ぐ

## 必要なもの

1. **AnthropicのAPIキー**
   [console.anthropic.com](https://console.anthropic.com/) でアカウントを作り、
   クレジットを購入(最少額でOK)して、API Keys からキーを発行する。
   費用は従量課金で、写真1枚あたり数円程度。
2. **アプリ用のパスワード**(自分で決める好きな文字列)

## ローカルで動かす

```bash
cd ocr-app
npm install
cp .env.example .env.local
# .env.local に ANTHROPIC_API_KEY と APP_PASSWORD を書く
npm run dev
```

## Vercelへのデプロイ

1. このリポジトリをVercelにインポートし、**Root Directory を `ocr-app`** に設定する
   (webappとは別プロジェクトとして作る)
2. Project Settings → Environment Variables に以下の2つを設定する
   - `ANTHROPIC_API_KEY`
   - `APP_PASSWORD`
3. Deploy

デプロイ後、スマホのブラウザでURLを開いてログインし、
**ホーム画面に追加**するとアプリのように使える。

## 使い方

1. 「📷 撮影 / ファイルを選ぶ」→ その場で撮影するか、写真・PDFを選ぶ(複数可)
2. 10〜30秒ほどで読み取り結果が項目ごとに表示される
   - 読めなかった文字は「?」になり、「読み取りメモ」に推測候補が書かれる
3. 何枚か読み取ったら「⬇️ CSVダウンロード」
   → Excelでそのまま開ける(1枚=1行、BOM付きUTF-8)

## 既存 ocr-excel との使い分け

- 活字・きれいな書類を秘書経由でまとめてExcel化 → `ocr-excel/`(Google Drive読み取り)
- 崩れた手書きをスマホでその場で読む → このアプリ

詳細は `decisions/2026-08-16-ocr-use-claude-api-vision.md` を参照。
