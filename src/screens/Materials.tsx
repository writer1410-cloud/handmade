import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Empty, NumberField, TextField } from "../components/Common";
import { materialUnitCost, materialUseUnit } from "../domain/calc";
import { yen } from "../lib/format";
import { FREE_LIMITS } from "../domain/defaults";
import type { Material } from "../domain/types";

const UNIT_PRESETS = ["個", "g", "cm", "m", "枚", "本", "ml", "セット"];

interface Draft {
  name: string;
  purchasePrice: number;
  purchaseQty: number;
  unit: string;
  purchaseShipping: number;
  /** 「取れる数」モードか（1購入から複数個つくれる材料） */
  byYield: boolean;
  /** 取れる数（byYield のときに使用） */
  yieldCount: number;
}

const emptyDraft: Draft = {
  name: "",
  purchasePrice: 0,
  purchaseQty: 0,
  unit: "個",
  purchaseShipping: 0,
  byYield: false,
  yieldCount: 0,
};

export default function Materials() {
  const nav = useNavigate();
  const { data, addMaterial, updateMaterial, deleteMaterial, canAddMaterial } = useStore();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const startEdit = (m: Material) => {
    setEditing(m.id);
    setDraft({
      name: m.name,
      purchasePrice: m.purchasePrice,
      purchaseQty: m.purchaseQty,
      unit: m.unit,
      purchaseShipping: m.purchaseShipping,
      byYield: !!m.yieldCount && m.yieldCount > 0,
      yieldCount: m.yieldCount ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name,
      purchasePrice: draft.purchasePrice,
      purchaseShipping: draft.purchaseShipping,
      // 取れる数モードでは購入量・単位は使わない（個分で扱う）
      purchaseQty: draft.byYield ? 1 : draft.purchaseQty,
      unit: draft.byYield ? "個" : draft.unit,
      yieldCount: draft.byYield ? draft.yieldCount : undefined,
    };
    if (editing) {
      updateMaterial(editing, payload);
    } else {
      addMaterial(payload);
    }
    setDraft(emptyDraft);
    setEditing(null);
    setShowForm(false);
  };

  // プレビュー：現在のモードに応じた単位原価
  const previewUnitCost = materialUnitCost({
    purchasePrice: draft.purchasePrice,
    purchaseShipping: draft.purchaseShipping,
    purchaseQty: draft.purchaseQty,
    yieldCount: draft.byYield ? draft.yieldCount : undefined,
  });
  const previewUnit = draft.byYield ? "個分" : draft.unit || "単位";

  return (
    <>
      <AppBar title="材料" back />
      <div className="screen">
        {!canAddMaterial && !editing && (
          <div className="alert warn">
            <span>🔒</span>
            <div>
              無料版は材料{FREE_LIMITS.materials}件まで。
              <button className="link" onClick={() => nav("/settings")}>
                Proで無制限に
              </button>
            </div>
          </div>
        )}

        {showForm ? (
          <div className="card">
            <h2>{editing ? "材料を編集" : "材料を登録"}</h2>
            <TextField
              label="材料名"
              value={draft.name}
              placeholder="例：丸カン 5mm ゴールド"
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <div className="row">
              <NumberField
                label="購入価格"
                suffix="円"
                value={draft.purchasePrice}
                onChange={(purchasePrice) => setDraft({ ...draft, purchasePrice })}
              />
              <NumberField
                label="購入時送料"
                suffix="円"
                value={draft.purchaseShipping}
                onChange={(purchaseShipping) => setDraft({ ...draft, purchaseShipping })}
              />
            </div>

            {/* 原価の数え方を切り替え */}
            <label className="field">
              <span>原価の数え方</span>
              <div className="tag-pick">
                <button
                  type="button"
                  className={!draft.byYield ? "on" : ""}
                  onClick={() => setDraft({ ...draft, byYield: false })}
                >
                  購入量で計算
                </button>
                <button
                  type="button"
                  className={draft.byYield ? "on" : ""}
                  onClick={() => setDraft({ ...draft, byYield: true })}
                >
                  取れる数で計算
                </button>
              </div>
            </label>

            {draft.byYield ? (
              <>
                <NumberField
                  label="取れる数（この購入で何個つくれる？）"
                  suffix="個"
                  value={draft.yieldCount}
                  onChange={(yieldCount) => setDraft({ ...draft, yieldCount })}
                />
                <p className="fineprint" style={{ marginTop: -6 }}>
                  例：フェルト1枚（¥500）から商品が10個つくれる → 取れる数「10」。作品では「1個分」使います。
                </p>
              </>
            ) : (
              <div className="row">
                <NumberField
                  label="購入量"
                  value={draft.purchaseQty}
                  onChange={(purchaseQty) => setDraft({ ...draft, purchaseQty })}
                />
                <label className="field">
                  <span>単位</span>
                  <input
                    list="unit-presets"
                    value={draft.unit}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  />
                  <datalist id="unit-presets">
                    {UNIT_PRESETS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </label>
              </div>
            )}

            <div className="alert info" style={{ marginTop: 4 }}>
              <span>🧮</span>
              <div>
                {draft.byYield ? (
                  <>
                    1個あたりの材料費 ＝（購入価格＋送料）÷取れる数 ={" "}
                    <strong>{yen(previewUnitCost)}/個分</strong>
                  </>
                ) : (
                  <>
                    単位原価 ＝（購入価格＋送料）÷購入量 ={" "}
                    <strong>
                      {yen(previewUnitCost)}/{previewUnit}
                    </strong>
                  </>
                )}
              </div>
            </div>

            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setDraft(emptyDraft);
                }}
              >
                キャンセル
              </button>
              <button className="btn" disabled={!draft.name.trim()} onClick={save}>
                保存
              </button>
            </div>
          </div>
        ) : (
          <button className="btn" disabled={!canAddMaterial} onClick={() => setShowForm(true)}>
            ＋ 材料を登録
          </button>
        )}

        <div className="section-title">登録済みの材料（{data.materials.length}件）</div>
        {data.materials.length === 0 ? (
          <Empty emoji="🧵" text="材料を登録すると、まとめ買いから1点あたりの単位原価を自動計算します。" />
        ) : (
          [...data.materials]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((m) => {
              const useUnit = materialUseUnit(m);
              return (
                <div key={m.id} className="list-item" onClick={() => startEdit(m)}>
                  <div className="main">
                    <div className="name">{m.name}</div>
                    <div className="sub">
                      {yen(m.purchasePrice)}
                      {m.purchaseShipping > 0 && `＋送料${yen(m.purchaseShipping)}`}
                      {m.yieldCount && m.yieldCount > 0 ? ` / ${m.yieldCount}個取り` : ` / ${m.purchaseQty}${m.unit}`}
                    </div>
                  </div>
                  <div className="trail">
                    {yen(materialUnitCost(m))}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>/{useUnit}</div>
                  </div>
                </div>
              );
            })
        )}

        {editing && (
          <button
            className="btn danger"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (confirm("この材料を削除しますか？\n使用中の作品からも取り除かれます。")) {
                deleteMaterial(editing);
                setShowForm(false);
                setEditing(null);
                setDraft(emptyDraft);
              }
            }}
          >
            この材料を削除
          </button>
        )}
      </div>
    </>
  );
}
