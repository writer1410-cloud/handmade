import { useRef, useState } from "react";
import { useStore } from "../store";
import { AppBar, NumberField } from "../components/Common";
import { exportBackup, parseBackup } from "../domain/storage";
import { materialsToCsv, worksToCsv } from "../domain/csv";
import { isPlayBillingAvailable, purchase, restore } from "../billing";
import type { SalesMethod } from "../domain/types";
import { yen } from "../lib/format";

function download(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export default function Settings() {
  const { data, updateSettings, upsertSalesMethod, deleteSalesMethod, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [methodDraft, setMethodDraft] = useState<SalesMethod | null>(null);

  const isPro = data.settings.isPro;

  const buy = async (plan: "monthly" | "yearly") => {
    const res = await purchase(plan);
    if (res.ok) {
      updateSettings({ isPro: true });
      alert("Proにアップグレードしました。ありがとうございます！");
    } else if (res.unsupported) {
      // 開発・ブラウザプレビュー用：手動でProを有効化（本番はPlay Billingで自動）
      if (confirm("この環境ではGoogle Play課金を実行できません。\nプレビュー用にProを有効化しますか？")) {
        updateSettings({ isPro: true });
      }
    } else {
      alert(res.message ?? "購入に失敗しました。");
    }
  };

  const importBackup = async (file: File) => {
    try {
      const text = await file.text();
      const next = parseBackup(text);
      if (confirm("現在のデータを、選んだバックアップで置き換えます。よろしいですか？")) {
        replaceAll(next);
        alert("復元しました。");
      }
    } catch (e) {
      alert("復元に失敗しました：" + String(e));
    }
  };

  const newMethod = (): SalesMethod => ({
    id: "m" + Date.now().toString(36),
    name: "",
    feePercent: 0,
    fixedFee: 0,
    consignmentPercent: 0,
    shippingBurden: 0,
  });

  return (
    <>
      <AppBar title="設定" back />
      <div className="screen">
        {/* Pro */}
        {isPro ? (
          <div className="pro-banner">
            <h3>✨ Pro 利用中</h3>
            <p style={{ margin: 0, fontSize: 14 }}>
              作品・材料が無制限。価格逆算、販売方法の比較、テンプレート、CSV出力が使えます。
            </p>
            <button
              className="btn ghost"
              style={{ marginTop: 12 }}
              onClick={() => {
                if (confirm("Proを解除しますか？（デモ用）")) updateSettings({ isPro: false });
              }}
            >
              Proを解除（デモ）
            </button>
          </div>
        ) : (
          <div className="pro-banner">
            <h3>Proにアップグレード</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              作品・材料が<strong>無制限</strong>に。価格逆算・販売方法の比較・テンプレート複製・CSV出力・広告なし。
            </p>
            <div className="row">
              <button className="btn" onClick={() => buy("monthly")}>
                月額 300円
              </button>
              <button className="btn secondary" onClick={() => buy("yearly")}>
                年額 3,000円
              </button>
            </div>
            <p className="fineprint">
              年額は実質10か月分（2か月分お得）。
              {!isPlayBillingAvailable() && "（このプレビューではPlay課金は動作しません）"}
            </p>
            <button
              className="link"
              style={{ marginTop: 6 }}
              onClick={async () => {
                if (await restore()) {
                  updateSettings({ isPro: true });
                  alert("購入を復元しました。");
                } else {
                  alert("復元できる購入が見つかりませんでした。");
                }
              }}
            >
              購入を復元
            </button>
          </div>
        )}

        {/* 計算の前提 */}
        <div className="card">
          <h2>計算の前提</h2>
          <NumberField
            label="目標時給"
            suffix="円/時"
            value={data.settings.targetHourlyWage}
            onChange={(targetHourlyWage) => updateSettings({ targetHourlyWage })}
          />
          <NumberField
            label="標準梱包費（新規作品の初期値）"
            suffix="円"
            value={data.settings.standardPackagingCost}
            onChange={(standardPackagingCost) => updateSettings({ standardPackagingCost })}
          />
        </div>

        {/* 販売方法テンプレート */}
        <div className="card">
          <h2>販売方法</h2>
          <p className="fineprint" style={{ marginTop: 0 }}>
            メルカリ・ラクマ・ヤフーフリマ・minne・Creema などの初期手数料は2026年時点の目安です。
            手数料は改定されるため、最新の規約に合わせて率を編集してください。その他のプラットフォームは
            「＋ 販売方法を追加」から手動で登録できます。
          </p>
          {data.salesMethods.map((m) => (
            <div key={m.id} className="list-item" style={{ boxShadow: "none" }} onClick={() => setMethodDraft({ ...m })}>
              <div className="main">
                <div className="name">{m.name}</div>
                <div className="sub">
                  手数料{m.feePercent}%{m.consignmentPercent > 0 && ` ＋委託${m.consignmentPercent}%`}
                  {m.fixedFee > 0 && ` ＋${yen(m.fixedFee)}`}
                  {m.shippingBurden > 0 && ` ＋送料${yen(m.shippingBurden)}`}
                </div>
              </div>
              <div className="trail" style={{ fontSize: 13, color: "var(--muted)" }}>
                編集 ›
              </div>
            </div>
          ))}
          <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => setMethodDraft(newMethod())}>
            ＋ 販売方法を追加
          </button>
        </div>

        {methodDraft && (
          <div className="card" style={{ borderColor: "var(--pink)" }}>
            <h2>{data.salesMethods.some((m) => m.id === methodDraft.id) ? "販売方法を編集" : "販売方法を追加"}</h2>
            <label className="field">
              <span>名前</span>
              <input
                value={methodDraft.name}
                placeholder="例：minne / Creema / 委託A店"
                onChange={(e) => setMethodDraft({ ...methodDraft, name: e.target.value })}
              />
            </label>
            <div className="row">
              <NumberField
                label="手数料率"
                suffix="%"
                step="0.01"
                value={methodDraft.feePercent}
                onChange={(feePercent) => setMethodDraft({ ...methodDraft, feePercent })}
              />
              <NumberField
                label="委託率"
                suffix="%"
                step="0.01"
                value={methodDraft.consignmentPercent}
                onChange={(consignmentPercent) => setMethodDraft({ ...methodDraft, consignmentPercent })}
              />
            </div>
            <div className="row">
              <NumberField
                label="固定手数料"
                suffix="円"
                value={methodDraft.fixedFee}
                onChange={(fixedFee) => setMethodDraft({ ...methodDraft, fixedFee })}
              />
              <NumberField
                label="送料の自己負担"
                suffix="円"
                value={methodDraft.shippingBurden}
                onChange={(shippingBurden) => setMethodDraft({ ...methodDraft, shippingBurden })}
              />
            </div>
            <div className="row">
              <button className="btn ghost" onClick={() => setMethodDraft(null)}>
                キャンセル
              </button>
              <button
                className="btn"
                disabled={!methodDraft.name.trim()}
                onClick={() => {
                  upsertSalesMethod(methodDraft);
                  setMethodDraft(null);
                }}
              >
                保存
              </button>
            </div>
            {!methodDraft.builtin && data.salesMethods.some((m) => m.id === methodDraft.id) && (
              <button
                className="btn danger"
                style={{ marginTop: 8 }}
                onClick={() => {
                  deleteSalesMethod(methodDraft.id);
                  setMethodDraft(null);
                }}
              >
                削除
              </button>
            )}
          </div>
        )}

        {/* データ */}
        <div className="card">
          <h2>データ（端末内に保存）</h2>
          <p className="fineprint" style={{ marginTop: 0 }}>
            データはこの端末の中だけに保存され、外部に送信されません。機種変更や削除に備えてバックアップを取りましょう。
          </p>
          <button
            className="btn secondary"
            onClick={() => download(`handmade-backup-${today()}.json`, exportBackup(data), "application/json")}
          >
            ⬇️ バックアップを書き出す
          </button>
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
            ⬆️ バックアップから復元
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.target.value = "";
            }}
          />

          <div style={{ height: 12 }} />
          <button
            className="btn ghost"
            onClick={() => {
              if (!isPro) return alert("CSV出力はProの機能です。");
              download(`works-${today()}.csv`, worksToCsv(data), "text/csv");
            }}
          >
            📄 作品をCSV出力{!isPro && "（Pro）"}
          </button>
          <button
            className="btn ghost"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (!isPro) return alert("CSV出力はProの機能です。");
              download(`materials-${today()}.csv`, materialsToCsv(data), "text/csv");
            }}
          >
            📄 材料をCSV出力{!isPro && "（Pro）"}
          </button>
        </div>

        {/* 免責 */}
        <div className="card">
          <h2>このアプリについて</h2>
          <p className="fineprint" style={{ marginTop: 0 }}>
            本アプリは価格・利益の試算ツールです。税務・会計・法的な助言を行うものではありません。手数料率や送料は各販売サービスの最新規約をご確認のうえ、ご自身の判断で価格を設定してください。算出される推奨価格は目安です。
          </p>
          <p className="fineprint">バージョン 0.1.0（MVP）</p>
        </div>
      </div>
    </>
  );
}
