/** 円表示（整数丸め、3桁区切り） */
export function yen(n: number): string {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

/** パーセント表示 */
export function pct(ratio: number): string {
  return (Math.round(ratio * 1000) / 10).toFixed(1) + "%";
}

/** 分を「○時間○分」表示 */
export function minutesLabel(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}分`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}時間` : `${h}時間${r}分`;
}
