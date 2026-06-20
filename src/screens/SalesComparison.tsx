import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Empty } from "../components/Common";
import { compareSalesMethods, unitCostMap } from "../domain/calc";
import { yen } from "../lib/format";

export default function SalesComparison() {
  const nav = useNavigate();
  const { data } = useStore();
  const costs = useMemo(() => unitCostMap(data.materials), [data.materials]);

  const [workId, setWorkId] = useState(data.works[0]?.id ?? "");
  const work = data.works.find((w) => w.id === workId);
  const [price, setPrice] = useState(work?.price || 0);

  if (data.works.length === 0) {
    return (
      <>
        <AppBar title="販売方法の比較" back />
        <div className="screen">
          <Empty
            emoji="⚖️"
            text="作品を作ると、オンライン・対面・委託・オーダーごとの手取りを比較できます。"
            action={
              <button className="btn" style={{ marginTop: 12 }} onClick={() => nav("/work/new")}>
                作品を追加
              </button>
            }
          />
        </div>
      </>
    );
  }

  const rows = work ? compareSalesMethods(price, work, costs, data.salesMethods) : [];
  const best = rows.reduce(
    (b, r) => (r.result.netProfit > (b?.result.netProfit ?? -Infinity) ? r : b),
    rows[0],
  );

  return (
    <>
      <AppBar title="販売方法の比較" back />
      <div className="screen">
        {!data.settings.isPro && (
          <div className="alert info">
            <span>✨</span>
            <div>
              販売方法の比較はProの機能です。
              <button className="link" onClick={() => nav("/settings")}>
                Proにする
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <label className="field">
            <span>作品</span>
            <select
              value={workId}
              onChange={(e) => {
                setWorkId(e.target.value);
                const w = data.works.find((x) => x.id === e.target.value);
                setPrice(w?.price || 0);
              }}
            >
              {data.works.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || "無題の作品"}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>同じ販売価格で比較</span>
            <div className="input-suffix">
              <input
                type="number"
                inputMode="decimal"
                value={price || ""}
                onChange={(e) => setPrice(e.target.value === "" ? 0 : parseFloat(e.target.value))}
              />
              <span className="suffix">円</span>
            </div>
          </label>
        </div>

        {data.settings.isPro ? (
          <div className="card">
            <h2>手取りの比較（販売価格 {yen(price)}）</h2>
            <table className="compare">
              <thead>
                <tr>
                  <th>販売方法</th>
                  <th>手数料</th>
                  <th>手取り</th>
                  <th>実質時給</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ method, result }) => (
                  <tr key={method.id}>
                    <td>
                      {method.name}
                      {best && method.id === best.method.id && price > 0 && (
                        <span className="badge good" style={{ marginLeft: 6 }}>
                          最大
                        </span>
                      )}
                    </td>
                    <td>{yen(result.fee + (method.shippingBurden || 0))}</td>
                    <td style={{ color: result.isLoss ? "var(--red)" : "var(--green)", fontWeight: 700 }}>
                      {yen(result.netProfit)}
                    </td>
                    <td>{work && work.productionMinutes > 0 ? yen(result.effectiveHourlyWage) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fineprint">
              手数料率・委託率・送料負担は「設定 ＞ 販売方法」で各サービスの最新規約に合わせて編集できます。
            </p>
          </div>
        ) : (
          <div className="pro-banner">
            <h3>🔒 比較はProの機能です</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              同じ作品をオンライン・対面・委託・オーダーで売ったとき、どこが一番手取りが多いか一覧で比較できます。
            </p>
            <button className="btn" onClick={() => nav("/settings")}>
              Proを見る
            </button>
          </div>
        )}

        <div className="alert info">
          <span>📐</span>
          <div>手数料率（％）に委託率も含めて手取りを計算します。送料を作家が負担する場合は販売方法に送料負担を設定してください。</div>
        </div>
      </div>
    </>
  );
}
