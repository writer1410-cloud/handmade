// Google Play 課金（Play Billing）連携のスタブ。
//
// PWA を TWA として Google Play に掲載する場合、アプリ内課金は
// **Digital Goods API + Payment Request API** 経由で Play Billing を呼び出す。
// （TWA からのみ window.getDigitalGoodsService が利用可能）
//
// 本アプリの課金は「買い切り（1回¥500）」のアプリ内アイテム1つだけ。
// 購入すると Pro になり、広告が消え、Pro機能が解放される。
// 本番では Play Console で以下の「1回限りのアイテム（管理対象商品）」を作成し、
// ここの PRODUCT_ID と一致させる：
//   - hmcc_pro_unlock : Proロック解除（¥500・買い切り）
//
// 参考: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
//
// 現状はローカル（設定の isPro フラグ）で代替し、課金UIと解除のフローだけ用意する。

/** Proロック解除（買い切り）の商品ID。Play Console の商品IDと一致させる。 */
export const PRODUCT_ID = "hmcc_pro_unlock";

/** 価格表示用（実際の課金額は Play Console の設定が優先される） */
export const PRO_PRICE_LABEL = "¥500";

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
 * 購入フロー（買い切り）。TWA 上では Digital Goods + PaymentRequest を呼び出す。
 * それ以外（開発・ブラウザプレビュー）では unsupported を返す。
 */
export async function purchase(): Promise<PurchaseResult> {
  if (!isPlayBillingAvailable()) {
    return { ok: false, unsupported: true, message: "Google Play アプリ上でのみ購入できます。" };
  }
  try {
    // 本番実装の骨子（TWA でのみ到達）:
    // const service = await (window as any).getDigitalGoodsService(
    //   "https://play.google.com/billing",
    // );
    // const details = await service.getDetails([PRODUCT_ID]);
    // const request = new PaymentRequest(
    //   [{ supportedMethods: "https://play.google.com/billing", data: { sku: PRODUCT_ID } }],
    //   { total: { label: "Pro（買い切り）", amount: { currency: "JPY", value: "0" } } },
    // );
    // const response = await request.show();
    // const { purchaseToken } = response.details;
    // // 買い切り（消費しない）なので acknowledge して所有を確定する
    // await service.acknowledge(purchaseToken);
    // await response.complete("success");
    // return { ok: true };
    return { ok: false, message: `購入フローは未配線です（${PRODUCT_ID}）。` };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}

/** 購入の復元。買い切りなので既存の購入トークンを照会して所有を確認する。 */
export async function restore(): Promise<boolean> {
  if (!isPlayBillingAvailable()) return false;
  // const service = await (window as any).getDigitalGoodsService("https://play.google.com/billing");
  // const purchases = await service.listPurchases();
  // return purchases.some((p) => p.itemId === PRODUCT_ID);
  return false;
}
