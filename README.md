# ハンドメイド原価計算アプリ

> 「売れているのに利益が残らない」を防ぐ。
> 材料費・制作時間・販売手数料から、**赤字にならない価格**と**実質時給**を計算する。

日本のハンドメイド作家（アクセサリー・レジン・布小物・編み物・キャンドル等）向けの、
作品1点の適正価格を3分で決められる価格・利益計算アプリです。

PWA（Progressive Web App）として実装し、**Bubblewrap / PWABuilder で TWA 化**して
Google Play に App Bundle（AAB）として掲載することを想定しています。
主要処理はすべて**端末内で完結**し、データは外部に送信しません（計画書の低コスト・低変動費方針）。

## 主な機能（MVP）

| 機能 | 内容 | 無料/Pro |
| --- | --- | --- |
| 材料管理 | 購入価格・量・単位・送料から単位原価を自動計算 | 無料（20件まで） |
| 作品管理 | 使用材料・制作時間・梱包費・その他経費 | 無料（3作品まで） |
| 価格シミュレーション | 価格を動かして利益・利益率・実質時給をリアルタイム表示 | 無料 |
| 価格逆算 | 赤字にならない最低価格／目標時給を確保できる価格 | Pro |
| 販売方法比較 | オンライン・対面・委託・オーダーの手取り比較 | Pro |
| テンプレート複製 | よく使う作品構成を複製 | Pro |
| バックアップ | 端末内データのJSON書き出し・復元 | 無料 |
| CSV出力 | 作品・材料の一覧をCSV出力 | Pro |

料金（計画書 6.1）：無料 / 月額300円 / 年額3,000円。

## 計算ロジック（計画書 4.2 に準拠）

```
材料単位原価 ＝（購入価格 ＋ 購入時送料）÷ 購入量
作品材料費   ＝ Σ（単位原価 × 使用量）
人件費相当   ＝ 制作時間(分) ÷ 60 × 目標時給
総原価       ＝ 材料費 ＋ 人件費相当 ＋ 梱包費 ＋ その他経費
手取り利益   ＝ 販売価格 － 販売手数料 － 送料負担 － 材料費 － 梱包費 － その他経費
実質時給     ＝ 手取り利益 ÷ 制作時間 × 60
```

実装は `src/domain/calc.ts`（純粋関数）。`src/domain/calc.test.ts` でテスト済み。

## 技術スタック

- **React 18 + TypeScript + Vite**
- **vite-plugin-pwa**（Service Worker / Web App Manifest）
- 状態管理：React Context（`src/store.tsx`）
- 保存：`localStorage`（端末内のみ・`src/domain/storage.ts`）
- 課金：Play Billing（Digital Goods API）スタブ `src/billing.ts`

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm test           # 計算ロジックのテスト
npm run build      # 本番ビルド（dist/）
npm run preview    # 本番ビルドのプレビュー
node scripts/gen-icons.mjs  # favicon.svg からPWAアイコンを再生成
```

## ディレクトリ構成

```
src/
  domain/         ドメイン層（型・計算・保存・CSV）— UIに依存しない
    types.ts      データモデル
    calc.ts       計算ロジック（純粋関数・テスト対象）
    calc.test.ts  テスト
    defaults.ts   既定値・無料版の制限・販売方法テンプレート
    storage.ts    localStorage 保存／バックアップ
    csv.ts        CSV出力（Pro）
  screens/        画面（Home / Materials / WorkEdit / PriceSimulation / SalesComparison / Settings）
  components/     共通UI
  lib/            表示フォーマット
  store.tsx       アプリ状態（Context）
  billing.ts      Play Billing スタブ
scripts/
  gen-icons.mjs   PWAアイコン生成
docs/
  play-store-listing.md  ストア掲載文（タイトル・説明・キーワード）
  twa-packaging.md       TWA化してPlayにAAB提出する手順
```

## Google Play への掲載

PWA を TWA としてパッケージし、AAB を Play Console にアップロードします。
手順は [`docs/twa-packaging.md`](docs/twa-packaging.md)、掲載文は
[`docs/play-store-listing.md`](docs/play-store-listing.md) を参照してください。

## 免責

本アプリは価格・利益の試算ツールであり、税務・会計・法的助言を行うものではありません。
販売手数料・送料は各サービスの最新規約をご確認ください。
