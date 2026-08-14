#!/usr/bin/env python3
"""読み取り済みの文字を受け取って、Excelの決めた列に書き込む。

Google Driveの文字読み取り機能で取り出した文章を、秘書(Claude)がこの
スクリプトに渡す。APIの鍵は一切不要。

使い方:
    python3 取り込み.py 読み取り結果.json

読み取り結果.json の形:
    [
      {"ファイル名": "領収書01.jpg", "全文": "領収書\n2026年8月12日\n..."},
      {"ファイル名": "領収書02.jpg", "全文": "..."}
    ]
"""

import json
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from lib import エクセル, 抽出  # noqa: E402

ここ = Path(__file__).parent
設定ファイル = ここ / "設定.yaml"


def 設定を読む() -> dict:
    with 設定ファイル.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def main(引数: list[str]) -> int:
    if len(引数) != 1:
        print("使い方: python3 取り込み.py 読み取り結果.json")
        return 1

    入力パス = Path(引数[0])
    if not 入力パス.exists():
        print(f"ファイルが見つかりません: {入力パス}")
        return 1

    with 入力パス.open(encoding="utf-8") as f:
        読み取り結果 = json.load(f)

    if not 読み取り結果:
        print("読み取り結果が空です。")
        return 0

    設定 = 設定を読む()
    項目設定 = 設定["項目"]
    出力パス = ここ / 設定["出力ファイル"]
    シート名 = 設定["シート名"]

    ブック, シート = エクセル.ブックを開くか作る(出力パス, シート名)
    if 設定.get("見出し行をつける", True):
        エクセル.見出しを書く(シート, 項目設定)

    for 一件 in 読み取り結果:
        ファイル名 = 一件.get("ファイル名", "")
        全文 = 一件.get("全文", "")
        値 = 抽出.一件ぶんを抽出する(全文, ファイル名, 項目設定)
        行 = エクセル.次の空き行を探す(シート)
        エクセル.一行書き込む(シート, 行, 値)
        print(f"  {行}行目 ← {ファイル名}")

    ブック.save(出力パス)
    print(f"\n{len(読み取り結果)}件を書き込みました: {出力パス}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
