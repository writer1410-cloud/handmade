import type { AppData } from "./types";
import { DATA_VERSION, emptyData } from "./defaults";

// 端末内（localStorage）にのみ保存する。クラウド送信は一切しない。
const KEY = "hmcc.appdata.v1";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return migrate(parsed);
  } catch (e) {
    console.error("データ読み込みに失敗しました", e);
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error("データ保存に失敗しました", e);
  }
}

/** 将来のスキーマ変更に備えた移行処理。不足フィールドは初期値で補完。 */
function migrate(parsed: Partial<AppData>): AppData {
  const base = emptyData();
  return {
    version: DATA_VERSION,
    materials: parsed.materials ?? base.materials,
    works: parsed.works ?? base.works,
    salesMethods: parsed.salesMethods?.length ? parsed.salesMethods : base.salesMethods,
    settings: { ...base.settings, ...parsed.settings },
  };
}

/** バックアップ（JSON）として書き出す文字列を作る */
export function exportBackup(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** バックアップ文字列を読み込んで検証する。失敗時は例外。 */
export function parseBackup(text: string): AppData {
  const parsed = JSON.parse(text) as Partial<AppData>;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.materials)) {
    throw new Error("バックアップ形式が正しくありません");
  }
  return migrate(parsed);
}
