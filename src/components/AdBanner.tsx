import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { PRO_PRICE_LABEL } from "../billing";

// 無料版に表示する広告枠。Pro（買い切り¥500）では非表示になる。
//
// 本番の広告は TWA + Google AdMob（または AdSense）で配信する想定。
// 実機（TWA）では、この枠に AdMob のバナーを差し込む。
// ブラウザ／PWAプレビューでは下のプレースホルダーを表示する。
// ここをタップすると Pro 購入（広告削除）へ誘導する。

export default function AdBanner() {
  const nav = useNavigate();
  const { data } = useStore();
  if (data.settings.isPro) return null; // Proは広告なし

  return (
    <div className="ad-banner" onClick={() => nav("/settings")}>
      <div className="ad-tag">広告</div>
      <div className="ad-body">
        <strong>広告を消すには</strong>
        <span>
          {PRO_PRICE_LABEL}の買い切りでProに。広告なし＆全機能が使えます。
        </span>
      </div>
      <span className="ad-cta">Proにする ›</span>
    </div>
  );
}
