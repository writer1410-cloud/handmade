import type { AppData, SalesMethod, Settings } from "./types";

export const DATA_VERSION = 1;

/** 無料版の制限（計画書 6.1）。Proで解除。 */
export const FREE_LIMITS = {
  works: 3,
  materials: 20,
};

export const DEFAULT_SETTINGS: Settings = {
  targetHourlyWage: 1000,
  standardPackagingCost: 50,
  isPro: false,
};

/**
 * 国内ハンドメイド販売の代表的な販売方法テンプレート。
 * 手数料率は固定値にせずユーザーが編集できる（計画書 リスク対策）。
 * 初期値は2026年時点の各サービスの公表値を目安に設定しているが、
 * 手数料は改定されるため、最新の各サービス規約で要確認。
 * ※「その他のプラットフォーム」は設定画面から手動で追加できる。
 */
export const DEFAULT_SALES_METHODS: SalesMethod[] = [
  {
    id: "mercari",
    name: "メルカリ",
    feePercent: 10, // 販売手数料 10%
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "rakuma",
    name: "ラクマ",
    feePercent: 6, // 4.5〜10%の変動制。目安として6%。
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "yahoo-flea",
    name: "ヤフーフリマ",
    feePercent: 5, // 販売手数料 5%
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "minne",
    name: "minne（ミンネ）",
    feePercent: 10.56, // 販売手数料 10.56%（税込）
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "creema",
    name: "Creema（クリーマ）",
    feePercent: 11, // 販売手数料 11%（税込）
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "in-person",
    name: "対面・イベント販売",
    feePercent: 0,
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "consignment",
    name: "委託販売",
    feePercent: 0,
    fixedFee: 0,
    consignmentPercent: 30,
    shippingBurden: 0,
    builtin: true,
  },
  {
    id: "order",
    name: "オーダーメイド（直接取引）",
    feePercent: 0,
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
    builtin: true,
  },
];

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    materials: [],
    works: [],
    salesMethods: DEFAULT_SALES_METHODS.map((m) => ({ ...m })),
    settings: { ...DEFAULT_SETTINGS },
  };
}
