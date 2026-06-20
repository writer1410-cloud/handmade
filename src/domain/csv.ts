import type { AppData } from "./types";
import { materialUseUnit, profitAt, unitCostMap, workCost } from "./calc";

// CSV出力（Pro機能）。Excelで開けるよう BOM 付き UTF-8 を想定。

function esc(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const round = (n: number) => Math.round(n);

/** 作品ごとの原価・利益サマリをCSV化する */
export function worksToCsv(data: AppData): string {
  const costs = unitCostMap(data.materials);
  const methodById = new Map(data.salesMethods.map((m) => [m.id, m]));
  const header = [
    "作品名",
    "販売価格",
    "材料費",
    "人件費相当",
    "梱包費",
    "送料",
    "その他経費",
    "総原価",
    "販売方法",
    "販売手数料",
    "送料負担",
    "手取り利益",
    "利益率(%)",
    "実質時給",
    "制作時間(分)",
  ];
  const rows = data.works.map((w) => {
    const method = w.salesMethodId ? methodById.get(w.salesMethodId) ?? null : null;
    const c = workCost(w, costs, data.settings, method);
    const p = profitAt(w.price, w, costs, method);
    return [
      esc(w.name),
      round(w.price),
      round(c.materialCost),
      round(c.laborCost),
      round(c.packagingCost),
      round(c.shippingCost),
      round(c.otherCost),
      round(c.totalCost),
      esc(method?.name ?? "未設定"),
      round(p.fee),
      round(p.shipping),
      round(p.netProfit),
      Math.round(p.profitMargin * 1000) / 10,
      round(p.effectiveHourlyWage),
      round(w.productionMinutes),
    ].join(",");
  });
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}

/** 材料一覧をCSV化する */
export function materialsToCsv(data: AppData): string {
  const costs = unitCostMap(data.materials);
  const header = ["材料名", "購入価格", "購入量", "単位", "取れる数", "購入時送料", "単位原価", "使用単位"];
  const rows = data.materials.map((m) =>
    [
      esc(m.name),
      round(m.purchasePrice),
      m.purchaseQty,
      esc(m.unit),
      m.yieldCount && m.yieldCount > 0 ? m.yieldCount : "",
      round(m.purchaseShipping),
      Math.round((costs.get(m.id) ?? 0) * 100) / 100,
      esc(materialUseUnit(m)),
    ].join(","),
  );
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}
