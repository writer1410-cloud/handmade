# TWA 化して Google Play に掲載する手順

この PWA を **TWA（Trusted Web Activity）** として Android アプリ（AAB）に変換し、
Google Play Console に提出するまでの手順をまとめます。

> 前提：このアプリは HTTPS で公開された URL
> （現在：`https://writer1410-cloud.github.io/handmade/`）として
> ホスティングされている必要があります。TWA はその URL を全画面で表示します。

## 全体像

```
[ Vite で本番ビルド ] → [ HTTPS で公開 ] → [ Bubblewrap で AAB 生成 ]
   npm run build          静的ホスティング        → Play Console へ提出
```

## 1. PWA を公開する

```bash
npm run build      # dist/ に出力
```

`dist/` を任意の静的ホスティングに配置します（Cloudflare Pages / Netlify /
Firebase Hosting / GitHub Pages 等。計画書のコスト方針に沿って無料枠で可）。

公開後、Lighthouse の PWA 監査が通ること（インストール可能・SW登録・manifest）を確認します。

## 2. Bubblewrap で TWA を生成

[Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap) を使います。
本リポジトリには設定済みの **`twa-manifest.json`（リポジトリ直下）** を同梱しているので、
`init` を省略してそのままビルドできます。

```bash
npm install -g @bubblewrap/cli

# リポジトリ直下（twa-manifest.json のある場所）で実行
cd /path/to/handmade

# 初回は Bubblewrap が JDK / Android SDK の取得を案内します（指示に従う）
# 署名鍵が無ければ作成するか、既存の android.keystore を指定
bubblewrap build      # app-release-bundle.aab（AAB）と app-release-signed.apk を生成
```

> はじめから作り直す場合：
> `bubblewrap init --manifest https://writer1410-cloud.github.io/handmade/manifest.webmanifest`

同梱の `twa-manifest.json` の主な値（このアプリ用に設定済み）：

| 項目 | 値 |
| --- | --- |
| Application ID（packageId） | `com.handmadecost.app`（一意・後から変更不可） |
| Host | `writer1410-cloud.github.io` |
| Start URL | `/handmade/` |
| App name / Launcher name | ハンドメイド原価計算 / 原価計算 |
| Theme color / Background | `#e26d8a` / `#fff7f9` |
| Icon / Maskable icon | `…/handmade/icons/icon-512.png` / `…/icon-maskable-512.png` |
| Play Billing | 有効（`features.playBilling.enabled = true`） |
| Version | `1.0.0`（versionCode `1`） |

> 代替：GUI なら [PWABuilder](https://www.pwabuilder.com/) に
> `https://writer1410-cloud.github.io/handmade/` を入力して AAB を生成しても同等です。

## 3. Digital Asset Links（URL とアプリの紐付け）

TWA はアドレスバーを隠すため、Web サイトとアプリの所有者一致を証明する必要があります。
配置すべき内容は **`docs/github-pages-root/`** に用意済み（ルートリポジトリへ
フォルダごとコピーするだけ。`package_name` 設定済み・フィンガープリントのみ要記入）。
詳細は同フォルダの `README.md` を参照。

### ⚠️ GitHub Pages（プロジェクトページ）での重要な注意

Chrome は Digital Asset Links を **ドメインのルート** から取得します。つまり
`https://writer1410-cloud.github.io/.well-known/assetlinks.json` が参照され、
**`/handmade/.well-known/…` ではありません**。本アプリはプロジェクトページ
（`/handmade/` 配下）で配信されているため、`/.well-known/assetlinks.json` を
**ユーザー（org）ルートの Pages リポジトリ**に置く必要があります。

対応方法（いずれか）：

- **A（無料・推奨）**：`writer1410-cloud.github.io` という名前のリポジトリを作成し、
  そこに `/.well-known/assetlinks.json` を置いて GitHub Pages で公開する。
  これで `https://writer1410-cloud.github.io/.well-known/assetlinks.json` が有効になる。
- **B（独自ドメイン）**：独自ドメインを取得して GitHub Pages に割り当て、
  そのドメイン直下に `/.well-known/assetlinks.json` を配置する。この場合は
  `twa-manifest.json` の `host` / 各 URL もそのドメインに変更する。

### 記入するフィンガープリント

`docs/github-pages-root/.well-known/assetlinks.json` の `sha256_cert_fingerprints` に、以下2つを記入します：

1. `bubblewrap build` 後に表示される**署名鍵**の SHA-256 フィンガープリント。
2. Play アプリ署名を使う場合は、**Play Console が発行する署名鍵**の SHA-256 も追記。
   （Play Console ＞ リリース ＞ 設定 ＞ アプリの署名 で確認）

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.handmadecost.app",
      "sha256_cert_fingerprints": [
        "<署名鍵のSHA-256>",
        "<Play アプリ署名のSHA-256>"
      ]
    }
  }
]
```

配置後、TWA を起動してアドレスバーが表示されなければ紐付け成功です。

## 4. アプリ内課金（買い切り ¥500）／広告

課金は「買い切り（1回 ¥500）」の管理対象アイテム1つだけ。購入すると Pro になり、
**広告が消えて**全機能が解放される。継続課金（定期購入）はなし。
TWA からの課金は **Digital Goods API + Payment Request API** 経由で Play Billing を呼ぶ。
実装の骨子は `src/billing.ts` にコメントとして記載済み。

1. Play Console ＞ 収益化 ＞ アプリ内アイテム（管理対象商品）を 1 つ作成：
   - `hmcc_pro_unlock`（Proロック解除・¥500・買い切り）
   `src/billing.ts` の `PRODUCT_ID` と一致させること。
2. TWA の Bubblewrap 設定で Play Billing を有効化（`"features": { "playBilling": { "enabled": true } }`）。
3. 端末上で購入トークンを取得 → サーバー検証（任意）→ `acknowledge`（消費しない）→ Pro 解除。
   復元は `listPurchases()` で `hmcc_pro_unlock` の所有を確認する。

### 広告（無料版のみ）
無料版はホーム画面に広告枠（`src/components/AdBanner.tsx`）を表示する。本番は
**Google AdMob** のバナーをこの枠に差し込む（TWA に AdMob SDK を組み込む）。
Pro購入後は `isPro` により広告枠は描画されない。AdMob 利用時は Play Console の
データセーフティで「広告」目的のデータ利用を申告すること。

> 参考：https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing

## 5. Play Console へ提出

1. アプリを作成し、`bubblewrap build` で生成した **AAB** をアップロード。
2. ストア掲載情報は [`play-store-listing.md`](play-store-listing.md) を反映。
3. データセーフティ：アプリのデータ収集なし（端末内保存）。広告(AdMob)利用時はその旨を申告。
4. アプリ内課金あり（買い切り ¥500）・広告ありを申告。
5. **クローズドテスト**から開始（計画書 30日計画の最終成果物）→ 製品版へ。

## チェックリスト（計画書 9. の「28〜30日」に対応）

- [ ] `npm run build` が通り、Lighthouse PWA 監査に合格
- [ ] HTTPS で公開済み、manifest / SW が有効
- [ ] `bubblewrap build` で AAB を生成（同梱の `twa-manifest.json` を使用）
- [ ] `assetlinks.json` を **ドメインルート**
      （`https://writer1410-cloud.github.io/.well-known/`）に配置し、アドレスバーが消える
- [ ] 買い切りアイテム `hmcc_pro_unlock`（¥500）を作成し購入・復元が動作
- [ ] スクリーンショット（`docs/store-assets/`）・説明文・アイコンを登録
- [ ] クローズドテストのトラックに AAB を提出
