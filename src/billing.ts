// Google Play 課金（Play Billing）連携のスタブ。
//
// PWA を TWA として Google Play に掲載する場合、アプリ内課金は
// **Digital Goods API + Payment Request API** 経由で Play Billing を呼び出す。
// （TWA からのみ window.getDigitalGoodsService が利用可能）
//
// 本番では Play Console で以下の定期購入を作成し、ここの PRODUCT_IDS と一致させる：
//   - hmcc_pro_monthly : 月額300円
//   - hmcc_pro_yearly  : 年額3,000円
//
// 参考: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
//
// 現状はローカル（設定の isPro フラグ）で代替し、課金UIと解除のフローだけ用意する。

export const PRODUCT_IDS = {
  monthly: "hmcc_pro_monthly",
  yearly: "hmcc_pro_yearly",
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

/** TWA(Play配信)上で Digital Goods API が使えるか */
export function isPlayBillingAvailable(): boolean {
  return typeof window !== "undefined" && "getDigitalGoodsService" in window;
}

export interface PurchaseResult {
  ok: boolean;
  /** Play Billing 未対応環境（通常のブラウザ等）か */
  unsupported?: boolean;
  message?: string;
}

/**
 * 購入フロー。TWA 上では Digital Goods + PaymentRequest を呼び出す。
 * それ以外（開発・ブラウザプレビュー）では unsupported を返す。
 */
export async function purchase(plan: PlanId): Promise<PurchaseResult> {
  if (!isPlayBillingAvailable()) {
    return { ok: false, unsupported: true, message: "Google Play アプリ上でのみ購入できます。" };
  }
  try {
    // 本番実装の骨子（TWA でのみ到達）:
    // const service = await (window as any).getDigitalGoodsService(
    //   "https://play.google.com/billing",
    // );
    // const details = await service.getDetails([PRODUCT_IDS[plan]]);
    // const request = new PaymentRequest(
    //   [{ supportedMethods: "https://play.google.com/billing", data: { sku: PRODUCT_IDS[plan] } }],
    //   { total: { label: "Pro", amount: { currency: "JPY", value: "0" } } },
    // );
    // const response = await request.show();
    // const { purchaseToken } = response.details;
    // await service.acknowledge(purchaseToken);
    // await response.complete("success");
    // return { ok: true };
    return { ok: false, message: `購入フローは未配線です（${PRODUCT_IDS[plan]}）。` };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/** 購入の復元。Play Billing では既存の購入トークンを照会する。 */
export async function restore(): Promise<boolean> {
  if (!isPlayBillingAvailable()) return false;
  // const service = await (window as any).getDigitalGoodsService("https://play.google.com/billing");
  // const purchases = await service.listPurchases();
  // return purchases.some((p) => Object.values(PRODUCT_IDS).includes(p.itemId));
  return false;
}
