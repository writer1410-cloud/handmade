import type { Material, SalesMethod, Settings, Work, WorkMaterial } from "./types";

// 計画書「4.2 主な計算ロジック」を厳密に実装した純粋関数群。
// すべて副作用なし・端末内で完結。テスト対象。

/** 安全な数値化（NaN/負数/無限大を 0 に丸める） */
export function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * 材料単位原価（使用1単位あたりの原価）。
 * - 取れる数（yieldCount）が設定されていれば「1個分」あたり：
 *     （購入価格 ＋ 購入時送料）÷ 取れる数
 *   例：フェルト¥500・送料0・取れる数10 → ¥50/個分
 * - それ以外は「購入量あたり」：
 *     （購入価格 ＋ 購入時送料）÷ 購入量
 * 分母が 0 以下の場合は 0 を返す（ゼロ除算回避）。
 */
export function materialUnitCost(
  m: Pick<Material, "purchasePrice" | "purchaseShipping" | "purchaseQty" | "yieldCount">,
): number {
  const total = num(m.purchasePrice) + num(m.purchaseShipping);
  const yieldCount = num(m.yieldCount);
  if (yieldCount > 0) return total / yieldCount;
  const qty = num(m.purchaseQty);
  if (qty <= 0) return 0;
  return total / qty;
}

/** 使用量を入力するときの単位ラベル。取れる数モードでは「個分」。 */
export function materialUseUnit(m: Pick<Material, "unit" | "yieldCount">): string {
  return num(m.yieldCount) > 0 ? "個分" : m.unit;
}

/** 材料IDから単位原価を引くためのマップを作る */
export function unitCostMap(materials: Material[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of materials) map.set(m.id, materialUnitCost(m));
  return map;
}

/**
 * 作品材料費 ＝ 各材料の単位原価 × 使用量 の合計
 */
export function workMaterialCost(items: WorkMaterial[], costs: Map<string, number>): number {
  return items.reduce((sum, it) => sum + (costs.get(it.materialId) ?? 0) * num(it.qty), 0);
}

/**
 * 人件費相当 ＝ 制作時間(分) ÷ 60 × 目標時給
 */
export function laborCost(productionMinutes: number, targetHourlyWage: number): number {
  return (num(productionMinutes) / 60) * num(targetHourlyWage);
}

/** 販売方法による手数料の合計（手数料率＋委託料率＋固定手数料）。価格に依存。 */
export function salesFee(price: number, method: SalesMethod | null): number {
  if (!method) return 0;
  const p = num(price);
  const rate = (num(method.feePercent) + num(method.consignmentPercent)) / 100;
  return p * rate + num(method.fixedFee);
}

export interface WorkCostBreakdown {
  materialCost: number;
  laborCost: number;
  packagingCost: number;
  /** 送料（作家が負担する分。販売方法が送料込みのときのみ計上） */
  shippingCost: number;
  otherCost: number;
  /** 総原価 ＝ 材料費＋人件費相当＋梱包費＋送料＋その他経費 */
  totalCost: number;
}

/**
 * 総原価 ＝ 材料費＋人件費相当＋梱包費＋送料＋その他経費
 * 送料は販売方法が「送料込み（作家負担）」のときのみ計上する。
 * method を省略（null）した場合は送料込みとみなす。
 */
export function workCost(
  work: Work,
  costs: Map<string, number>,
  settings: Settings,
  method: SalesMethod | null = null,
): WorkCostBreakdown {
  const materialCost = workMaterialCost(work.materials, costs);
  const labor = laborCost(work.productionMinutes, settings.targetHourlyWage);
  const packagingCost = num(work.packagingCost);
  const shippingCost = workShipping(work, method);
  const otherCost = num(work.otherCost);
  return {
    materialCost,
    laborCost: labor,
    packagingCost,
    shippingCost,
    otherCost,
    totalCost: materialCost + labor + packagingCost + shippingCost + otherCost,
  };
}

/**
 * この作品の発送で作家が負担する送料。
 * 販売方法が「送料込み（sellerPaysShipping）」のときだけ送料を負担する。
 * 販売方法が未設定（null）の場合は送料込みとみなして負担に含める。
 */
export function workShipping(work: Pick<Work, "shippingCost">, method: SalesMethod | null): number {
  const seller = method ? method.sellerPaysShipping : true;
  return seller ? num(work.shippingCost) : 0;
}

export interface ProfitResult {
  price: number;
  /** 販売手数料（円） */
  fee: number;
  /** 作家が負担する送料（円） */
  shipping: number;
  /** 手取り利益 ＝ 販売価格－販売手数料－送料負担－材料費－梱包費－その他経費 */
  netProfit: number;
  /** 利益率 ＝ 手取り利益 ÷ 販売価格 */
  profitMargin: number;
  /** 実質時給 ＝ 手取り利益 ÷ 制作時間 × 60 */
  effectiveHourlyWage: number;
  /** 人件費相当も確保できているか（手取り利益 ≧ 人件費相当） */
  coversLabor: boolean;
  /** 赤字か（手取り利益 < 0） */
  isLoss: boolean;
}

/**
 * ある販売価格における利益・利益率・実質時給を計算する。
 * 計画書定義：
 *   手取り利益 ＝ 販売価格 － 販売手数料 － 送料負担 － 材料費 － 梱包費 － その他経費
 *   実質時給   ＝ 手取り利益 ÷ 制作時間 × 60
 * ※ 手取り利益は「人件費相当」を引く前の作家の取り分。実質時給と二重控除しない。
 */
export function profitAt(
  price: number,
  work: Work,
  costs: Map<string, number>,
  method: SalesMethod | null,
): ProfitResult {
  const p = num(price);
  const fee = salesFee(p, method);
  const shipping = workShipping(work, method);
  const materialCost = workMaterialCost(work.materials, costs);
  const packagingCost = num(work.packagingCost);
  const otherCost = num(work.otherCost);

  const netProfit = p - fee - shipping - materialCost - packagingCost - otherCost;
  const minutes = num(work.productionMinutes);

  return {
    price: p,
    fee,
    shipping,
    netProfit,
    profitMargin: p > 0 ? netProfit / p : 0,
    effectiveHourlyWage: minutes > 0 ? (netProfit / minutes) * 60 : 0,
    coversLabor: false, // settings に依存するため caller 側で補完
    isLoss: netProfit < 0,
  };
}

/**
 * 価格逆算：目標時給を確保するための推奨最低価格を求める。
 * 目標手取り利益 ＝ 人件費相当（＝制作時間/60 × 目標時給）
 * 価格に比例する手数料（率）を考慮して解く：
 *   net = price*(1 - rate) - fixedFee - shipping - materialCost - packaging - other
 *   net ≧ targetProfit となる最小 price
 */
export function recommendedPrice(
  work: Work,
  costs: Map<string, number>,
  method: SalesMethod | null,
  targetHourlyWage: number,
  options?: { targetProfit?: number; targetMargin?: number },
): number {
  const materialCost = workMaterialCost(work.materials, costs);
  const packagingCost = num(work.packagingCost);
  const otherCost = num(work.otherCost);
  const shipping = workShipping(work, method);
  const fixedFee = method ? num(method.fixedFee) : 0;
  const rate = method ? (num(method.feePercent) + num(method.consignmentPercent)) / 100 : 0;

  const labor = laborCost(work.productionMinutes, targetHourlyWage);
  const targetProfit = options?.targetProfit != null ? num(options.targetProfit) : labor;

  // price*(1-rate) = targetProfit + fixedFee + shipping + material + packaging + other
  const fixedCosts = fixedFee + shipping + materialCost + packagingCost + otherCost;
  const denom = 1 - rate;
  if (denom <= 0) return 0; // 手数料率が100%以上は計算不能
  let price = (targetProfit + fixedCosts) / denom;

  // 利益率の下限指定があれば満たす（margin = net/price ≧ targetMargin）
  // net = price*(1-rate) - fixedCosts ≧ price*targetMargin
  if (options?.targetMargin != null) {
    const m = num(options.targetMargin);
    const denom2 = 1 - rate - m;
    if (denom2 > 0) {
      const priceForMargin = fixedCosts / denom2;
      price = Math.max(price, priceForMargin);
    }
  }

  // 10円単位で切り上げ（販売しやすい価格に丸める）
  return Math.ceil(price / 10) * 10;
}

/** 複数の販売方法での手取り比較行 */
export interface SalesMethodComparisonRow {
  method: SalesMethod;
  result: ProfitResult;
}

export function compareSalesMethods(
  price: number,
  work: Work,
  costs: Map<string, number>,
  methods: SalesMethod[],
): SalesMethodComparisonRow[] {
  return methods.map((method) => ({
    method,
    result: profitAt(price, work, costs, method),
  }));
}
