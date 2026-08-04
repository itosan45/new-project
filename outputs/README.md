# outputs

実際にできあがった成果物(記事・コード・デザイン案など)の記録を置く場所。
成果物そのものではなく、「いつ・何を作ったか」の記録でも良い。

作り直した(バージョンが上がった)場合は、上書きせず新しいファイルを追加し、
`supersedes` に古い方のファイルを書く。これで「どれが最新で、何を作り直した
ものか」の歴史が消えずに残る。

```markdown
---
title: 成果物のタイトル
artifactId: webapp        # 同じ成果物を通して同じIDにする
version: 2
supersedes: outputs/2026-08-03-webapp-v1.md
partOf: tasks/xxx.md
---

内容...
```
