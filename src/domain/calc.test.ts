import { describe, expect, it } from "vitest";
import {
  laborCost,
  materialUnitCost,
  profitAt,
  recommendedPrice,
  salesFee,
  unitCostMap,
  workCost,
  workMaterialCost,
} from "./calc";
import type { Material, SalesMethod, Settings, Work } from "./types";

const mat = (id: string, price: number, qty: number, shipping = 0): Material => ({
  id,
  name: id,
  purchasePrice: price,
  purchaseQty: qty,
  unit: "個",
  purchaseShipping: shipping,
  createdAt: 0,
  updatedAt: 0,
});

const settings: Settings = { targetHourlyWage: 1000, standardPackagingCost: 50, isPro: false };

describe("materialUnitCost", () => {
  it("（購入価格＋送料）÷購入量", () => {
    // 1000円で100個＋送料500円 → (1000+500)/100 = 15円/個
    expect(materialUnitCost(mat("a", 1000, 100, 500))).toBe(15);
  });
  it("購入量0はゼロ除算を避けて0", () => {
    expect(materialUnitCost(mat("a", 1000, 0))).toBe(0);
  });
});

describe("workMaterialCost", () => {
  it("単位原価×使用量の合計", () => {
    const materials = [mat("a", 1000, 100), mat("b", 500, 50)]; // 10円/個, 10円/個
    const costs = unitCostMap(materials);
    // a を3個, b を2個 → 30 + 20 = 50
    expect(workMaterialCost([{ materialId: "a", qty: 3 }, { materialId: "b", qty: 2 }], costs)).toBe(50);
  });
});

describe("laborCost", () => {
  it("制作時間(分)/60 × 目標時給", () => {
    // 90分, 時給1000 → 1.5h × 1000 = 1500
    expect(laborCost(90, 1000)).toBe(1500);
  });
});

describe("salesFee", () => {
  const method: SalesMethod = {
    id: "m",
    name: "オンライン",
    feePercent: 10,
    fixedFee: 60,
    consignmentPercent: 0,
    shippingBurden: 0,
  };
  it("価格×率＋固定手数料", () => {
    // 3000円 × 10% + 60 = 360
    expect(salesFee(3000, method)).toBe(360);
  });
  it("method が null なら 0", () => {
    expect(salesFee(3000, null)).toBe(0);
  });
});

describe("workCost (総原価)", () => {
  it("材料費＋人件費相当＋梱包費＋その他経費", () => {
    const materials = [mat("a", 1000, 100)]; // 10円/個
    const costs = unitCostMap(materials);
    const work: Work = {
      id: "w",
      name: "ピアス",
      materials: [{ materialId: "a", qty: 5 }], // 50円
      productionMinutes: 60, // 人件費 1000円
      packagingCost: 50,
      otherCost: 30,
      price: 0,
      salesMethodId: null,
      createdAt: 0,
      updatedAt: 0,
    };
    const b = workCost(work, costs, settings);
    expect(b.materialCost).toBe(50);
    expect(b.laborCost).toBe(1000);
    expect(b.totalCost).toBe(50 + 1000 + 50 + 30);
  });
});

describe("profitAt", () => {
  const materials = [mat("a", 1000, 100)]; // 10円/個
  const costs = unitCostMap(materials);
  const work: Work = {
    id: "w",
    name: "ピアス",
    materials: [{ materialId: "a", qty: 10 }], // 材料費100円
    productionMinutes: 60,
    packagingCost: 100,
    otherCost: 0,
    price: 3000,
    salesMethodId: null,
    createdAt: 0,
    updatedAt: 0,
  };
  const method: SalesMethod = {
    id: "m",
    name: "オンライン",
    feePercent: 10,
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 200,
  };

  it("手取り利益＝価格－手数料－送料負担－材料費－梱包費－その他", () => {
    const r = profitAt(3000, work, costs, method);
    // 手数料 = 300, 送料200, 材料100, 梱包100 → net = 3000-300-200-100-100 = 2300
    expect(r.fee).toBe(300);
    expect(r.netProfit).toBe(2300);
    expect(r.profitMargin).toBeCloseTo(2300 / 3000);
    // 実質時給 = 2300 / 60 * 60 = 2300
    expect(r.effectiveHourlyWage).toBe(2300);
    expect(r.isLoss).toBe(false);
  });

  it("計画書の例：3000円で売って実質時給が低い", () => {
    // 制作180分、材料が高いケースで実質時給500円付近になることを確認
    const w2: Work = { ...work, materials: [{ materialId: "a", qty: 100 }], productionMinutes: 180, packagingCost: 100 };
    const r = profitAt(3000, w2, costs, method);
    // 材料費=1000, 手数料300, 送料200, 梱包100 → net=1400, 3hで実質時給 ≈ 466.7
    expect(r.netProfit).toBe(1400);
    expect(r.effectiveHourlyWage).toBeCloseTo(1400 / 180 * 60);
    expect(r.effectiveHourlyWage).toBeLessThan(500);
  });

  it("赤字を検出する", () => {
    const r = profitAt(200, work, costs, method);
    expect(r.isLoss).toBe(true);
    expect(r.netProfit).toBeLessThan(0);
  });
});

describe("recommendedPrice (価格逆算)", () => {
  const materials = [mat("a", 1000, 100)]; // 10円/個
  const costs = unitCostMap(materials);
  const work: Work = {
    id: "w",
    name: "ピアス",
    materials: [{ materialId: "a", qty: 10 }], // 材料費100円
    productionMinutes: 60, // 目標時給1000 → 人件費1000
    packagingCost: 100,
    otherCost: 0,
    price: 0,
    salesMethodId: null,
    createdAt: 0,
    updatedAt: 0,
  };
  const method: SalesMethod = {
    id: "m",
    name: "オンライン",
    feePercent: 10,
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
  };

  it("目標時給を確保できる価格を逆算（手数料率込み）", () => {
    const price = recommendedPrice(work, costs, method, 1000);
    // 必要net=1000(人件費), 固定費=材料100+梱包100=200
    // price*(1-0.1) = 1000+200 → price = 1200/0.9 = 1333.3 → 10円切上 1340
    expect(price).toBe(1340);
    // 検算：この価格で実質時給が目標1000以上
    const r = profitAt(price, work, costs, method);
    expect(r.effectiveHourlyWage).toBeGreaterThanOrEqual(1000);
  });

  it("手数料率100%以上は0を返す", () => {
    const bad: SalesMethod = { ...method, feePercent: 100 };
    expect(recommendedPrice(work, costs, bad, 1000)).toBe(0);
  });
});
