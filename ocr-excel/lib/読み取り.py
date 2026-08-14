"""Google Cloud Vision APIで画像・PDFから文字を読み取る処理。"""

import io
from pathlib import Path

from google.cloud import vision


def クライアントを作る():
    """Vision APIの接続を作る。

    GOOGLE_APPLICATION_CREDENTIALS 環境変数に鍵ファイルのパスが
    設定されている前提。設定されていなければ分かりやすいエラーにする。
    """
    import os

    鍵 = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not 鍵:
        raise RuntimeError(
            "Google Cloudの鍵ファイルが設定されていません。\n"
            "手順は ocr-excel/README.md の「準備」を見てください。"
        )
    if not Path(鍵).exists():
        raise RuntimeError(f"鍵ファイルが見つかりません: {鍵}")
    return vision.ImageAnnotatorClient()


def 画像から文字を読む(クライアント, ファイルパス: Path) -> str:
    """1枚の画像から文字を読み取って返す。手書きにも対応。"""
    内容 = ファイルパス.read_bytes()
    画像 = vision.Image(content=内容)
    # document_text_detection は手書き・帳票に強い
    応答 = クライアント.document_text_detection(
        image=画像,
        image_context=vision.ImageContext(language_hints=["ja"]),
    )
    if 応答.error.message:
        raise RuntimeError(f"読み取りに失敗しました: {応答.error.message}")
    return 応答.full_text_annotation.text or ""


def PDFから文字を読む(クライアント, ファイルパス: Path) -> str:
    """PDFから文字を読み取って返す。全ページ分をつなげる。"""
    内容 = ファイルパス.read_bytes()
    要求 = vision.AnnotateFileRequest(
        input_config=vision.InputConfig(
            content=内容, mime_type="application/pdf"
        ),
        features=[
            vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)
        ],
        image_context=vision.ImageContext(language_hints=["ja"]),
    )
    応答 = クライアント.batch_annotate_files(requests=[要求])
    ページ文字 = []
    for ファイル応答 in 応答.responses:
        for ページ応答 in ファイル応答.responses:
            if ページ応答.error.message:
                raise RuntimeError(
                    f"読み取りに失敗しました: {ページ応答.error.message}"
                )
            ページ文字.append(ページ応答.full_text_annotation.text or "")
    return "\n".join(ページ文字)


def 文字を読み取る(クライアント, ファイルパス: Path) -> str:
    """拡張子を見て、画像とPDFを振り分ける。"""
    if ファイルパス.suffix.lower() == ".pdf":
        return PDFから文字を読む(クライアント, ファイルパス)
    return 画像から文字を読む(クライアント, ファイルパス)
