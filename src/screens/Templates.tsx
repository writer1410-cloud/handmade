import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Empty } from "../components/Common";
import { minutesLabel, yen } from "../lib/format";

export default function Templates() {
  const nav = useNavigate();
  const { data, deleteTemplate, createWorkFromTemplate, canAddWork } = useStore();
  const isPro = data.settings.isPro;
  const templates = [...data.templates].sort((a, b) => b.updatedAt - a.updatedAt);

  const create = (id: string) => {
    if (!isPro) {
      nav("/settings");
      return;
    }
    if (!canAddWork) {
      alert("無料版の作品数の上限に達しています。Proにすると無制限に作れます。");
      return;
    }
    const w = createWorkFromTemplate(id);
    if (w) nav(`/work/${w.id}`);
  };

  return (
    <>
      <AppBar title="テンプレート" />
      <div className="screen">
        <div className="alert info">
          <span>📋</span>
          <div>
            よく作る作品の構成（材料・制作時間・梱包費・送料・販売方法）をテンプレートとして保存し、
            次の作品をすぐに作れます。テンプレートは作品の編集画面の「テンプレートとして保存」から登録できます。
          </div>
        </div>

        {!isPro && (
          <div className="pro-banner">
            <h3>✨ テンプレートはProの機能です</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              定番の作品構成を保存して、毎回の入力を省けます。Proにアップグレードすると使えます。
            </p>
            <button className="btn" onClick={() => nav("/settings")}>
              Proを見る
            </button>
          </div>
        )}

        <div className="section-title">保存済みのテンプレート（{templates.length}件）</div>
        {templates.length === 0 ? (
          <Empty
            emoji="📋"
            text="まだテンプレートがありません。作品を作って編集画面で「テンプレートとして保存」すると、ここに表示されます。"
            action={
              <button className="btn" style={{ marginTop: 12 }} onClick={() => nav(canAddWork ? "/work/new" : "/settings")}>
                作品を作る
              </button>
            }
          />
        ) : (
          templates.map((t) => (
            <div key={t.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name" style={{ fontWeight: 700 }}>
                    {t.name || "（無題のテンプレート）"}
                  </div>
                  <div className="sub" style={{ fontSize: 13, color: "var(--muted)" }}>
                    材料{t.materials.length}点 ・ {minutesLabel(t.productionMinutes)}
                    {t.price > 0 && ` ・ 想定${yen(t.price)}`}
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => create(t.id)}>
                  この内容で作品を作る
                </button>
                <button
                  className="btn ghost"
                  style={{ flex: "none", width: "auto" }}
                  onClick={() => {
                    if (confirm("このテンプレートを削除しますか？")) deleteTemplate(t.id);
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
