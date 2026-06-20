import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, Empty, NumberField, TextField } from "../components/Common";
import { materialUnitCost } from "../domain/calc";
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
}

const emptyDraft: Draft = { name: "", purchasePrice: 0, purchaseQty: 0, unit: "個", purchaseShipping: 0 };

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
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editing) {
      updateMaterial(editing, draft);
    } else {
      addMaterial(draft);
    }
    setDraft(emptyDraft);
    setEditing(null);
    setShowForm(false);
  };

  const previewUnitCost = materialUnitCost(draft);

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

            <div className="alert info" style={{ marginTop: 4 }}>
              <span>🧮</span>
              <div>
                単位原価 ＝（購入価格＋送料）÷購入量 ={" "}
                <strong>
                  {yen(previewUnitCost)}/{draft.unit || "単位"}
                </strong>
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
            .map((m) => (
              <div key={m.id} className="list-item" onClick={() => startEdit(m)}>
                <div className="main">
                  <div className="name">{m.name}</div>
                  <div className="sub">
                    {yen(m.purchasePrice)}
                    {m.purchaseShipping > 0 && `＋送料${yen(m.purchaseShipping)}`} / {m.purchaseQty}
                    {m.unit}
                  </div>
                </div>
                <div className="trail">
                  {yen(materialUnitCost(m))}
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>/{m.unit}</div>
                </div>
              </div>
            ))
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
