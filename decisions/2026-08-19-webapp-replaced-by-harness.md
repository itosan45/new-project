---
title: Vercelに出すものを、秘書アプリから業務自動化ハーネスに差し替えた
tags: [ハーネス, 運用, engineer]
basedOn: [decisions/2026-08-19-engagement-six-stages.md]
---

## 決めたこと

`webapp/` の中身を、`harness/` の内容に入れ替えた。
以前ここにあった「スマホから閲覧・追記する秘書アプリ」は置き換えて終了。

## なぜフォルダ名を `harness` にしなかったか

Vercel側の Root Directory が `webapp` を指しているため。
フォルダ名を変えると、Vercelの設定画面で1か所いじる必要がある。
スマホからその操作をするのが手間なので、**設定を触らずに済むほう**を選んだ。

名前と中身が一致しない点は承知のうえ。`webapp/README.md` の冒頭に
理由を書いてある。あとで設定を変えられるときに `harness/` へ戻してよい。

## 消えたもの、残っているもの

- 消えた: 秘書アプリの画面（inbox・ログの閲覧と追記）
- 残っている: gitの履歴。`git show f8bfdf4:webapp/` などで取り出せる

## 変わらないもの

- URL
- ログインパスワード
- 必要な環境変数（GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH /
  GITHUB_TOKEN / APP_PASSWORD）。両方のアプリで同じだったため、
  Vercel側の設定はそのままで動く
