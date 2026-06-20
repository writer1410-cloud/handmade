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
 * 初期値は一般的な目安であり、最新の各サービス規約で要確認。
 */
export const DEFAULT_SALES_METHODS: SalesMethod[] = [
  {
    id: "online-platform",
    name: "オンライン販売（手数料あり）",
    feePercent: 11,
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
