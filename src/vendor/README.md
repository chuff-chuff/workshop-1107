# src/vendor

外部ライブラリを、拡張機能で使える1つのファイルにまとめたもの（バンドル済み）を置くフォルダ。
ここにあるファイルは手で編集しない。

| ファイル | 入手元 | バージョン | ライセンス |
|---|---|---|---|
| `dom-accessibility-api.js` | npm: [dom-accessibility-api](https://www.npmjs.com/package/dom-accessibility-api)（[GitHub](https://github.com/eps1lon/dom-accessibility-api)） | 0.7.1 | MIT（`dom-accessibility-api.LICENSE.md`） |

## 使い方

`dom-accessibility-api.js` を読み込むと、グローバル変数 `domAccessibilityApi` から次の関数が使える。

- `domAccessibilityApi.computeAccessibleName(element)`

## 作り直す手順

```bash
npm ci                 # package-lock.json のとおりに入れる（ハッシュ値で検証される）
npm run build:vendor   # src/vendor/dom-accessibility-api.js を作り直す
```

- 入口ファイルは `scripts/vendor-entry.js`。
- ライブラリのバージョンを変える時は、`package.json` と、このファイルの表、`package.json` の `build:vendor` のバナー文字列を合わせて更新する。
