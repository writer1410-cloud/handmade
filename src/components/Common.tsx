import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function AppBar({ title, back }: { title: string; back?: boolean }) {
  const nav = useNavigate();
  return (
    <header className="appbar">
      {back && (
        <button className="back" aria-label="戻る" onClick={() => nav(-1)}>
          ‹
        </button>
      )}
      <h1>{title}</h1>
    </header>
  );
}

/** 数値入力フィールド（単位サフィックス付き）。空文字を許容して0扱いにする。 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = "1",
  min = "0",
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-suffix">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          placeholder={placeholder}
          value={Number.isFinite(value) && value !== 0 ? value : value === 0 ? "" : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? 0 : parseFloat(v));
          }}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Stat({
  label,
  value,
  tone,
  span2,
}: {
  label: string;
  value: ReactNode;
  tone?: "good" | "bad";
  span2?: boolean;
}) {
  return (
    <div className={`stat ${tone ?? ""} ${span2 ? "span2" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export function Empty({ emoji, text, action }: { emoji: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <p>{text}</p>
      {action}
    </div>
  );
}
