# Changelog

このプロジェクトの主な変更点はこのファイルに記録します。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、
バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Added

- Chrome 拡張機能（Manifest V3）のリポジトリの土台を作成（フォルダ構成、manifest.json、_locales、「準備OK」と表示する最小限のポップアップ、README、LICENSE、CLAUDE.md など）
- 企画書（docs/planning.md）と、フェーズ1（代替テキストの表示）の仕様書（docs/spec.md）を追加
- アクセシブルな名前の計算用ライブラリ dom-accessibility-api 0.7.1 をバンドルして `src/vendor/` に同梱（バンドルの仕組みとして package.json、.npmrc、scripts/vendor-entry.js を追加）
- 代替テキストの表示機能（フェーズ1）を実装
  - ポップアップで表示のオン・オフと表示モード（画像を消す／画像も表示する）を切り替え。表示モードは保存される
  - 代替テキストがない画像には「スクリーンリーダーユーザーなどには意味が伝わらない画像がここにあります」と表示
  - permissions に `activeTab`、`scripting`、`storage` を追加
- 拡張機能の名前を日本語「みえるくん」、英語「Altie」に決定
- 拡張機能のアイコン（16・32・48・128px）を追加
