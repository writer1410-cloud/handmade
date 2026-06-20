import type { AppData, SalesMethod } from "./types";
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
    works: (parsed.works ?? base.works).map(normalizeWork),
    salesMethods: mergeSalesMethods(parsed.salesMethods, base.salesMethods),
    settings: { ...base.settings, ...parsed.settings },
  };
}

/** 旧データの作品に送料フィールドを補完する。 */
function normalizeWork(w: AppData["works"][number]): AppData["works"][number] {
  return { ...w, shippingCost: typeof w.shippingCost === "number" ? w.shippingCost : 0 };
}

/** 旧データの販売方法を新スキーマ（sellerPaysShipping）へ変換する。 */
function normalizeMethod(m: SalesMethod & { shippingBurden?: number }): SalesMethod {
  const sellerPaysShipping =
    typeof m.sellerPaysShipping === "boolean" ? m.sellerPaysShipping : (m.shippingBurden ?? 0) > 0;
  return {
    id: m.id,
    name: m.name,
    feePercent: m.feePercent,
    fixedFee: m.fixedFee,
    consignmentPercent: m.consignmentPercent,
    sellerPaysShipping,
    builtin: m.builtin,
  };
}

/**
 * 販売方法のマージ。
 * - 保存済みが無ければ初期テンプレートをそのまま使う。
 * - 保存済みがあれば、ユーザーの編集・追加分を保持しつつ、
 *   未登録の組み込みテンプレート（新プラットフォーム等）を追加する。
 */
function mergeSalesMethods(saved: SalesMethod[] | undefined, builtins: SalesMethod[]): SalesMethod[] {
  if (!saved?.length) return builtins;
  const normalized = saved.map(normalizeMethod);
  const existingIds = new Set(normalized.map((m) => m.id));
  const missingBuiltins = builtins.filter((b) => !existingIds.has(b.id));
  return [...normalized, ...missingBuiltins];
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
