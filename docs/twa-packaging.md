# TWA 化して Google Play に掲載する手順

この PWA を **TWA（Trusted Web Activity）** として Android アプリ（AAB）に変換し、
Google Play Console に提出するまでの手順をまとめます。

> 前提：このアプリは HTTPS で公開された URL（例：`https://app.example.com`）として
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

```bash
npm install -g @bubblewrap/cli

# 公開した manifest を指定して初期化
bubblewrap init --manifest https://app.example.com/manifest.webmanifest

# ビルド（署名鍵を作成・指定）。AAB が生成される
bubblewrap build
```

初期化時に以下を設定します（manifest から多くが自動補完されます）：

| 項目 | 値の例 |
| --- | --- |
| Application ID | `com.example.handmadecost`（一意・後から変更不可） |
| App name | ハンドメイド原価計算 |
| Launcher name | 原価計算 |
| Theme color | `#e26d8a` |
| Background color | `#fff7f9` |
| Start URL | `/` |
| Icon | `https://app.example.com/icons/icon-512.png` |
| Maskable icon | `https://app.example.com/icons/icon-maskable-512.png` |

> 代替：GUI なら [PWABuilder](https://www.pwabuilder.com/) に URL を入力し、
> Android パッケージ（AAB）を生成しても同等のことができます。

## 3. Digital Asset Links（URL とアプリの紐付け）

TWA はアドレスバーを隠すため、Web サイトとアプリの所有者一致を証明する必要があります。

1. `bubblewrap build` 後に表示される SHA-256 署名フィンガープリントを控える。
2. 公開サイトに `/.well-known/assetlinks.json` を配置：

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.handmadecost",
      "sha256_cert_fingerprints": ["<署名のSHA-256フィンガープリント>"]
    }
  }
]
```

Play アプリ署名を使う場合は、Play Console が発行する署名鍵のフィンガープリントも追記します。

## 4. アプリ内課金（月額300円／年額3,000円）

TWA からの課金は **Digital Goods API + Payment Request API** 経由で Play Billing を呼びます。
実装の骨子は `src/billing.ts` にコメントとして記載済み。

1. Play Console ＞ 収益化 ＞ 定期購入で 2 つ作成：
   - `hmcc_pro_monthly`（月額300円）
   - `hmcc_pro_yearly`（年額3,000円）
   `src/billing.ts` の `PRODUCT_IDS` と一致させること。
2. TWA の Bubblewrap 設定で Play Billing を有効化（`"features": { "playBilling": { "enabled": true } }`）。
3. 端末上で購入トークンを取得 → サーバー検証（任意）→ `acknowledge` → Pro 解除。

> 参考：https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing

## 5. Play Console へ提出

1. アプリを作成し、`bubblewrap build` で生成した **AAB** をアップロード。
2. ストア掲載情報は [`play-store-listing.md`](play-store-listing.md) を反映。
3. データセーフティ：データ収集なし（端末内保存）を申告。
4. アプリ内課金あり（定期購入）を申告。
5. **クローズドテスト**から開始（計画書 30日計画の最終成果物）→ 製品版へ。

## チェックリスト（計画書 9. の「28〜30日」に対応）

- [ ] `npm run build` が通り、Lighthouse PWA 監査に合格
- [ ] HTTPS で公開済み、manifest / SW が有効
- [ ] `assetlinks.json` を配置し、アドレスバーが消える
- [ ] 定期購入 2 種を作成し購入・復元が動作
- [ ] スクリーンショット・説明文・アイコンを登録
- [ ] クローズドテストのトラックに AAB を提出
