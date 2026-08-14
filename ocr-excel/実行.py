#!/usr/bin/env python3
"""入力画像フォルダの画像・PDFを読み取って、Excelに自動入力する。

使い方:
    python3 実行.py

入力画像フォルダに入っているファイルを順番に処理し、
設定.yaml で決めた列に値を入れていく。
処理が終わったファイルは 処理済み フォルダに移動する。
"""

import shutil
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from lib import エクセル, 抽出, 読み取り  # noqa: E402

ここ = Path(__file__).parent
入力フォルダ = ここ / "入力画像"
処理済みフォルダ = ここ / "処理済み"
設定ファイル = ここ / "設定.yaml"

対応拡張子 = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".pdf"}


def 設定を読む() -> dict:
    with 設定ファイル.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def 処理対象を集める() -> list[Path]:
    if not 入力フォルダ.exists():
        return []
    return sorted(
        p
        for p in 入力フォルダ.iterdir()
        if p.is_file() and p.suffix.lower() in 対応拡張子
    )


def main() -> int:
    設定 = 設定を読む()
    項目設定 = 設定["項目"]
    出力パス = ここ / 設定["出力ファイル"]
    シート名 = 設定["シート名"]

    対象 = 処理対象を集める()
    if not 対象:
        print(f"入力画像フォルダに処理するファイルがありません: {入力フォルダ}")
        return 0

    print(f"{len(対象)}件のファイルを処理します。")

    try:
        クライアント = 読み取り.クライアントを作る()
    except RuntimeError as e:
        print(f"\nエラー: {e}")
        return 1

    ブック, シート = エクセル.ブックを開くか作る(出力パス, シート名)
    if 設定.get("見出し行をつける", True):
        エクセル.見出しを書く(シート, 項目設定)

    成功 = 0
    失敗 = []
    for ファイル in 対象:
        print(f"  読み取り中: {ファイル.name} ... ", end="", flush=True)
        try:
            全文 = 読み取り.文字を読み取る(クライアント, ファイル)
        except Exception as e:
            print(f"失敗 ({e})")
            失敗.append(ファイル.name)
            continue

        値 = 抽出.一件ぶんを抽出する(全文, ファイル.name, 項目設定)
        行 = エクセル.次の空き行を探す(シート)
        エクセル.一行書き込む(シート, 行, 値)
        print(f"完了 → {行}行目")

        処理済みフォルダ.mkdir(exist_ok=True)
        shutil.move(str(ファイル), str(処理済みフォルダ / ファイル.name))
        成功 += 1

    ブック.save(出力パス)
    print(f"\n{成功}件を書き込みました: {出力パス}")
    if 失敗:
        print(f"読み取れなかったファイル({len(失敗)}件): {', '.join(失敗)}")
        print("これらは入力画像フォルダに残してあります。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
