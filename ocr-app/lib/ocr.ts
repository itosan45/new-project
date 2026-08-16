// 読み取り結果の項目。ocr-excel/設定.yaml の項目構成(日付・金額・宛名・
// 電話番号・全文)を踏襲し、書類の種類と読み取りメモを加えたもの。
export type OcrResult = {
  docType: string;
  date: string;
  amount: string;
  addressee: string;
  phone: string;
  fullText: string;
  note: string;
};

export const OCR_FIELD_LABELS: { key: keyof OcrResult; label: string }[] = [
  { key: "docType", label: "書類の種類" },
  { key: "date", label: "日付" },
  { key: "amount", label: "金額" },
  { key: "addressee", label: "宛名" },
  { key: "phone", label: "電話番号" },
  { key: "fullText", label: "全文" },
  { key: "note", label: "読み取りメモ" },
];

export type OcrApiResponse = { result: OcrResult } | { error: string };
