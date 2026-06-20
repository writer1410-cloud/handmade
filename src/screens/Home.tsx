import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Empty } from "../components/Common";
import { profitAt, unitCostMap } from "../domain/calc";
import { yen } from "../lib/format";
import { FREE_LIMITS } from "../domain/defaults";

export default function Home() {
  const nav = useNavigate();
  const { data, canAddWork } = useStore();
  const costs = unitCostMap(data.materials);
  const methodById = new Map(data.salesMethods.map((m) => [m.id, m]));

  const works = [...data.works].sort((a, b) => b.updatedAt - a.updatedAt);
  const lossCount = works.filter((w) => {
    const method = w.salesMethodId ? methodById.get(w.salesMethodId) ?? null : null;
    return w.price > 0 && profitAt(w.price, w, costs, method).isLoss;
  }).length;

  return (
    <>
      <AppBar title="ハンドメイド原価計算" />
      <div className="screen">
        {!data.settings.isPro && (
          <div className="alert info">
            <span>💡</span>
            <div>
              無料版：作品{data.works.length}/{FREE_LIMITS.works}・材料{data.materials.length}/
              {FREE_LIMITS.materials}件まで。{" "}
              <button className="link" onClick={() => nav("/settings")}>
                Proで無制限に
              </button>
            </div>
          </div>
        )}

        {lossCount > 0 && (
          <div className="alert bad">
            <span>⚠️</span>
            <div>
              <strong>{lossCount}件</strong>の作品が現在の価格では赤字です。価格を見直しましょう。
            </div>
          </div>
        )}

        <button className="btn" onClick={() => nav(canAddWork ? "/work/new" : "/settings")}>
          ＋ 作品を追加して価格を計算
        </button>

        <div className="section-title">作品一覧</div>
        {works.length === 0 ? (
          <Empty emoji="🎨" text="まだ作品がありません。材料を登録して、最初の作品の価格を計算しましょう。" />
        ) : (
          works.map((w) => {
            const method = w.salesMethodId ? methodById.get(w.salesMethodId) ?? null : null;
            const r = profitAt(w.price, w, costs, method);
            const hasPrice = w.price > 0;
            return (
              <div key={w.id} className="list-item" onClick={() => nav(`/work/${w.id}/sim`)}>
                <div className="main">
                  <div className="name">{w.name || "（無題の作品）"}</div>
                  <div className="sub">
                    {hasPrice ? (
                      <>
                        実質時給 {yen(r.effectiveHourlyWage)}/時 ・{" "}
                        {r.isLoss ? (
                          <span style={{ color: "var(--red)" }}>赤字</span>
                        ) : (
                          <>利益 {yen(r.netProfit)}</>
                        )}
                      </>
                    ) : (
                      "価格未設定"
                    )}
                  </div>
                </div>
                <div className="trail">{hasPrice ? yen(w.price) : "—"}</div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
