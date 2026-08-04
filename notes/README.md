# notes

まだ判断になっていない、思いつき・アイデア・雑なメモを置く場所。

各ファイルの先頭に、以下のような「タグ付け」(frontmatter)を書くと、
`npm run graph` が自動でつながりを見つけてくれる。書かなくても動く。

```markdown
---
title: メモのタイトル
tags: [経理, アイデア]
basedOn: [references/xxx.md]
---

本文...
```
