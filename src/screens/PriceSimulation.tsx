import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Stat } from "../components/Common";
import { profitAt, recommendedPrice, unitCostMap } from "../domain/calc";
import { minutesLabel, pct, yen } from "../lib/format";

export default function PriceSimulation() {
  const nav = useNavigate();
  const { id } = useParams();
  const { data, updateWork, duplicateWork, canAddWork } = useStore();
  const work = data.works.find((w) => w.id === id);
  const costs = useMemo(() => unitCostMap(data.materials), [data.materials]);

  const [price, setPrice] = useState(work?.price ?? 0);

  if (!work) {
    return (
      <>
        <AppBar title="価格シミュレーション" back />
        <div className="screen">
          <p>作品が見つかりません。</p>
        </div>
      </>
    );
  }

  const method = work.salesMethodId ? data.salesMethods.find((m) => m.id === work.salesMethodId) ?? null : null;
  const r = profitAt(price, work, costs, method);
  const labor = (work.productionMinutes / 60) * data.settings.targetHourlyWage;
  const coversTarget = r.effectiveHourlyWage >= data.settings.targetHourlyWage && work.productionMinutes > 0;

  const recForWage = recommendedPrice(work, costs, method, data.settings.targetHourlyWage);
  const recBreakeven = recommendedPrice(work, costs, method, 0, { targetProfit: 0 });

  // スライダー範囲：推奨価格の2倍か、現在価格の1.5倍の大きい方
  const sliderMax = Math.max(recForWage * 2, price * 1.5, 1000);

  const apply = (p: number) => {
    setPrice(p);
  };
  const persist = () => updateWork(work.id, { price });

  return (
    <>
      <AppBar title={work.name || "価格シミュレーション"} back />
      <div className="screen">
        {r.isLoss && (
          <div className="alert bad">
            <span>⚠️</span>
            <div>この価格は赤字です。最低でも{yen(recBreakeven)}以上で販売しましょう。</div>
          </div>
        )}

        <div className="card">
          <div className="price-display">{yen(price)}</div>
          <input
            className="slider"
            type="range"
            min={0}
            max={Math.ceil(sliderMax / 10) * 10}
            step={10}
            value={price}
            onChange={(e) => apply(parseFloat(e.target.value))}
          />
          <div className="result-grid">
            <Stat label="手取り利益" value={yen(r.netProfit)} tone={r.isLoss ? "bad" : "good"} />
            <Stat label="利益率" value={pct(r.profitMargin)} tone={r.isLoss ? "bad" : undefined} />
            <Stat
              label="実質時給"
              value={work.productionMinutes > 0 ? yen(r.effectiveHourlyWage) : "—"}
              tone={coversTarget ? "good" : r.effectiveHourlyWage < 0 ? "bad" : undefined}
              span2
            />
          </div>
          {work.productionMinutes > 0 && (
            <div className="alert info" style={{ marginTop: 12 }}>
              <span>{coversTarget ? "✅" : "📉"}</span>
              <div>
                目標時給{yen(data.settings.targetHourlyWage)}に対し、この価格の実質時給は
                <strong> {yen(r.effectiveHourlyWage)}</strong>。
                {coversTarget ? "目標を達成しています。" : `あと${yen(Math.max(0, recForWage - price))}上げると到達します。`}
              </div>
            </div>
          )}
        </div>

        {data.settings.isPro ? (
          <div className="card">
            <h2>おすすめ価格（逆算）</h2>
            <div className="result-grid">
              <button className="stat tappable" style={{ cursor: "pointer" }} onClick={() => apply(recBreakeven)}>
                <div className="label">赤字にならない最低価格</div>
                <div className="value" style={{ fontSize: 18 }}>
                  {yen(recBreakeven)}
                </div>
              </button>
              <button className="stat tappable" style={{ cursor: "pointer" }} onClick={() => apply(recForWage)}>
                <div className="label">目標時給を確保できる価格</div>
                <div className="value" style={{ fontSize: 18 }}>
                  {yen(recForWage)}
                </div>
              </button>
            </div>
            <p className="fineprint">タップするとその価格を適用します。手数料・送料負担・目標時給を考慮し10円単位で算出。</p>
          </div>
        ) : (
          <div className="pro-banner">
            <h3>🔒 おすすめ価格の逆算（Pro）</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              「赤字にならない最低価格」「目標時給を確保できる価格」を手数料込みで自動計算します。
            </p>
            <button className="btn" onClick={() => nav("/settings")}>
              Proを見る
            </button>
          </div>
        )}

        <div className="card">
          <h2>内訳（販売価格 {yen(price)}）</h2>
          <ul className="breakdown">
            <li>
              <span className="muted">販売価格</span>
              <span>{yen(price)}</span>
            </li>
            <li>
              <span className="muted">− 販売手数料{method ? `（${method.name}）` : ""}</span>
              <span>−{yen(r.fee)}</span>
            </li>
            {r.shipping > 0 && (
              <li>
                <span className="muted">− 送料（送料込み）</span>
                <span>−{yen(r.shipping)}</span>
              </li>
            )}
            <li>
              <span className="muted">− 材料費・梱包費・その他</span>
              <span>−{yen(r.price - r.fee - r.shipping - r.netProfit)}</span>
            </li>
            <li className="total">
              <span>手取り利益</span>
              <span style={{ color: r.isLoss ? "var(--red)" : "var(--green)" }}>{yen(r.netProfit)}</span>
            </li>
          </ul>
          <p className="fineprint">
            制作時間 {minutesLabel(work.productionMinutes)} ・ 人件費相当 {yen(labor)}（実質時給の基準）
          </p>
        </div>

        <button className="btn" onClick={() => { persist(); nav("/"); }}>
          この価格で保存
        </button>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn secondary" onClick={() => nav(`/work/${work.id}`)}>
            作品を編集
          </button>
          <button
            className="btn ghost"
            disabled={!data.settings.isPro || !canAddWork}
            onClick={() => {
              if (!data.settings.isPro) {
                nav("/settings");
                return;
              }
              const dup = duplicateWork(work.id);
              if (dup) nav(`/work/${dup.id}`);
            }}
          >
            複製{!data.settings.isPro && "（Pro）"}
          </button>
        </div>
      </div>
    </>
  );
}
