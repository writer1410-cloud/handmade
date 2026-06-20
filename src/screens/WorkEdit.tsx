import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { AppBar, NumberField, TextField } from "../components/Common";
import { materialUnitCost, materialUseUnit, unitCostMap, workCost } from "../domain/calc";
import { yen } from "../lib/format";
import type { Work, WorkMaterial } from "../domain/types";

export default function WorkEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const { data, addWork, updateWork, deleteWork, saveTemplate } = useStore();
  const existing = id ? data.works.find((w) => w.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [materials, setMaterials] = useState<WorkMaterial[]>(existing?.materials ?? []);
  const [productionMinutes, setProductionMinutes] = useState(existing?.productionMinutes ?? 0);
  const [packagingCost, setPackagingCost] = useState(
    existing?.packagingCost ?? data.settings.standardPackagingCost,
  );
  const [otherCost, setOtherCost] = useState(existing?.otherCost ?? 0);
  const [shippingCost, setShippingCost] = useState(existing?.shippingCost ?? 0);
  const [price, setPrice] = useState(existing?.price ?? 0);
  const [salesMethodId, setSalesMethodId] = useState<string | null>(
    existing?.salesMethodId ?? data.salesMethods[0]?.id ?? null,
  );

  const costs = useMemo(() => unitCostMap(data.materials), [data.materials]);

  const setQty = (materialId: string, qty: number) => {
    setMaterials((prev) => {
      const found = prev.find((m) => m.materialId === materialId);
      if (qty <= 0) return prev.filter((m) => m.materialId !== materialId);
      if (found) return prev.map((m) => (m.materialId === materialId ? { ...m, qty } : m));
      return [...prev, { materialId, qty }];
    });
  };

  const draft: Work = {
    id: existing?.id ?? "preview",
    name,
    materials,
    productionMinutes,
    packagingCost,
    shippingCost,
    otherCost,
    price,
    salesMethodId,
    createdAt: existing?.createdAt ?? 0,
    updatedAt: 0,
  };
  const selectedMethod = salesMethodId ? data.salesMethods.find((m) => m.id === salesMethodId) ?? null : null;
  const breakdown = workCost(draft, costs, data.settings, selectedMethod);

  const saveAsTemplate = () => {
    if (!data.settings.isPro) {
      nav("/settings");
      return;
    }
    const tplName = window.prompt("テンプレート名を入力してください。", name.trim() || "新しいテンプレート");
    if (tplName === null) return; // キャンセル
    const created = saveTemplate({
      name: tplName.trim() || "新しいテンプレート",
      materials,
      productionMinutes,
      packagingCost,
      shippingCost,
      otherCost,
      price,
      salesMethodId,
    });
    if (created) alert("テンプレートとして保存しました。「テンプレート」タブから作品を作れます。");
  };

  const save = (goSim: boolean) => {
    const payload = { name: name.trim() || "無題の作品", materials, productionMinutes, packagingCost, shippingCost, otherCost, price, salesMethodId };
    if (existing) {
      updateWork(existing.id, payload);
      if (goSim) nav(`/work/${existing.id}/sim`);
      else nav(-1);
    } else {
      const created = addWork(payload);
      if (created) nav(goSim ? `/work/${created.id}/sim` : "/");
    }
  };

  return (
    <>
      <AppBar title={existing ? "作品を編集" : "作品を追加"} back />
      <div className="screen">
        <div className="card">
          <TextField label="作品名" value={name} placeholder="例：天然石のピアス" onChange={setName} />
          <NumberField
            label="制作時間"
            suffix="分"
            value={productionMinutes}
            onChange={setProductionMinutes}
          />
          <div className="row">
            <NumberField label="梱包費" suffix="円" value={packagingCost} onChange={setPackagingCost} />
            <NumberField label="送料" suffix="円" value={shippingCost} onChange={setShippingCost} />
          </div>
          <NumberField label="その他経費" suffix="円" value={otherCost} onChange={setOtherCost} />
          <p className="fineprint" style={{ marginTop: -4 }}>
            送料は発送にかかる金額（例：ネコポス¥210）。「送料込み」の販売方法のときに差し引かれます。対面販売など送料負担なしの方法では計算に含まれません。
            {selectedMethod &&
              (selectedMethod.sellerPaysShipping
                ? `　現在の「${selectedMethod.name}」は送料込み（差し引く）。`
                : `　現在の「${selectedMethod.name}」は送料負担なし。`)}
          </p>
        </div>

        <div className="card">
          <h2>使用する材料</h2>
          {data.materials.length === 0 ? (
            <p className="sub" style={{ color: "var(--muted)" }}>
              先に
              <button className="link" onClick={() => nav("/materials")}>
                材料を登録
              </button>
              してください。
            </p>
          ) : (
            data.materials.map((m) => {
              const cur = materials.find((x) => x.materialId === m.id);
              const useUnit = materialUseUnit(m);
              return (
                <div key={m.id} className="mat-pick-row">
                  <div className="info">
                    <div className="nm">{m.name}</div>
                    <div className="uc">
                      {yen(materialUnitCost(m))}/{useUnit}
                    </div>
                  </div>
                  <input
                    className="qty"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={cur?.qty ?? ""}
                    onChange={(e) => setQty(m.id, e.target.value === "" ? 0 : parseFloat(e.target.value))}
                  />
                  <span style={{ width: 32, fontSize: 12, color: "var(--muted)" }}>{useUnit}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <h2>販売方法</h2>
          <label className="field">
            <span>手数料・送料負担の計算に使用</span>
            <select value={salesMethodId ?? ""} onChange={(e) => setSalesMethodId(e.target.value || null)}>
              <option value="">未設定</option>
              {data.salesMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="想定販売価格" suffix="円" value={price} onChange={setPrice} />
        </div>

        <div className="card">
          <h2>原価の内訳</h2>
          <ul className="breakdown">
            <li>
              <span className="muted">材料費</span>
              <span>{yen(breakdown.materialCost)}</span>
            </li>
            <li>
              <span className="muted">人件費相当（時給{yen(data.settings.targetHourlyWage)}）</span>
              <span>{yen(breakdown.laborCost)}</span>
            </li>
            <li>
              <span className="muted">梱包費</span>
              <span>{yen(breakdown.packagingCost)}</span>
            </li>
            <li>
              <span className="muted">
                送料
                {selectedMethod && !selectedMethod.sellerPaysShipping && shippingCost > 0 && "（負担なし）"}
              </span>
              <span>{yen(breakdown.shippingCost)}</span>
            </li>
            <li>
              <span className="muted">その他経費</span>
              <span>{yen(breakdown.otherCost)}</span>
            </li>
            <li className="total">
              <span>総原価</span>
              <span>{yen(breakdown.totalCost)}</span>
            </li>
          </ul>
        </div>

        <button className="btn" onClick={() => save(true)}>
          保存して価格シミュレーション →
        </button>
        <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => save(false)}>
          保存する
        </button>
        <button className="btn ghost" style={{ marginTop: 8 }} onClick={saveAsTemplate}>
          📋 テンプレートとして保存{!data.settings.isPro && "（Pro）"}
        </button>

        {existing && (
          <button
            className="btn danger"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (confirm("この作品を削除しますか？")) {
                deleteWork(existing.id);
                nav("/");
              }
            }}
          >
            この作品を削除
          </button>
        )}
      </div>
    </>
  );
}
