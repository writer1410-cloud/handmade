# `writer1410-cloud.github.io` ルートリポジトリ用ファイル

このフォルダの中身は、**別途作成する GitHub Pages のルートリポジトリ**
（リポジトリ名：`writer1410-cloud.github.io`）の**ルートにそのまま配置**するためのものです。

TWA（Androidアプリ）とこのサイトを紐付ける Digital Asset Links は、
ブラウザが必ず**ドメインのルート**から読み込みます：

```
https://writer1410-cloud.github.io/.well-known/assetlinks.json
```

本アプリはプロジェクトページ（`/handmade/` 配下）なので、`/handmade/.well-known/…`
に置いても参照されません。そのため、ユーザー（org）ルートの Pages リポジトリが必要です。

## 手順

1. GitHub で **`writer1410-cloud.github.io`** という名前のリポジトリを新規作成（Public）。
2. このフォルダの **`.well-known/assetlinks.json`** を、そのリポジトリのルートに
   `/.well-known/assetlinks.json` として置く（フォルダ構造ごとコピー）。
3. リポジトリの Settings ＞ Pages で公開（ブランチ `main` / フォルダ `/ (root)`）。
4. 数分後、ブラウザで次が JSON として表示されれば配置成功：
   `https://writer1410-cloud.github.io/.well-known/assetlinks.json`

## フィンガープリントの差し替え（必須）

`assetlinks.json` の 2 か所のプレースホルダを実際の値に置き換えます：

| プレースホルダ | 取得元 |
| --- | --- |
| `REPLACE_WITH_UPLOAD_KEY_SHA256` | `bubblewrap build` 後に表示される署名鍵の SHA-256（`keytool -list -v -keystore android.keystore` でも確認可） |
| `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` | Play Console ＞ リリース ＞ 設定 ＞ アプリの署名 に表示される「アプリ署名鍵」の SHA-256 |

> Play アプリ署名をまだ有効化していない段階では、まず 1 個目（アップロード鍵）だけでも可。
> 2 個目は Play Console にアップロード後に判明するので、後から追記してください。
> 2 つとも入れておくと、テスト時と本番配信時の両方でアドレスバーが消えます。

## 確認

配置後、TWA を起動して**上部のアドレスバーが表示されなければ紐付け成功**です。
（表示される場合は、URL・package_name・フィンガープリントのいずれかが不一致）

参考：https://developer.chrome.com/docs/android/trusted-web-activity/quick-start#creating-your-asset-link-file
