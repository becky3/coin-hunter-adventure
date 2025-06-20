# コインハンター アドベンチャー

モダンな2Dプラットフォームゲーム - ブラウザで遊べるアクションゲーム

![Game Version](https://img.shields.io/badge/version-1.2.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 ゲーム概要

プレイヤーを操作して、様々なプラットフォームを冒険し、コインを集めながら敵を避けてゴールを目指すクラシックな2Dプラットフォームゲームです。Web Audio APIによる動的な音楽生成とSVGベースのグラフィックで、モダンでスムーズなゲーム体験を提供します。

### デモプレイ
[こちらでプレイできます](https://becky3.github.io/coin-hunter-adventure/)（準備中）

## ✨ 特徴

- **動的音楽生成**: Web Audio APIによるリアルタイム音楽生成
- **SVGグラフィック**: スムーズでクリアなベクターグラフィック
- **レスポンシブデザイン**: 様々な画面サイズに対応
- **モダンUI**: グラスモーフィズムを採用した洗練されたインターフェース
- **高度な物理演算**: リアルな重力と衝突判定
- **モジュラー設計**: メンテナンスしやすいクリーンなコード構造

## 🎯 操作方法

### キーボード操作
| アクション | キー |
|-----------|------|
| 左移動 | `←` または `A` |
| 右移動 | `→` または `D` |
| ジャンプ | `スペース` または `W` |

### ゲーム目標
- 🪙 **コインを集める**: ステージ内のコインを収集してスコアアップ
- 👾 **敵を倒す**: 敵の上からジャンプして踏みつける
- 🏁 **ゴールに到達**: フラッグに触れてステージクリア
- ⏱️ **タイムリミット**: 制限時間内にクリアを目指す

## 🚀 クイックスタート

### 必要な環境
- モダンなWebブラウザ（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- Python 3.x または Node.js（開発サーバー用）

### セットアップ手順

1. **リポジトリをクローン**
```bash
git clone https://github.com/becky3/coin-hunter-adventure.git
cd coin-hunter-adventure
```

2. **HTTPサーバーを起動**

<details>
<summary>Python を使用する場合</summary>

```bash
python3 -m http.server 8080
```
</details>

<details>
<summary>Node.js を使用する場合</summary>

```bash
npx serve .
# または
npm install -g http-server
http-server -p 8080
```
</details>

<details>
<summary>PHP を使用する場合</summary>

```bash
php -S localhost:8080
```
</details>

3. **ブラウザでアクセス**
```
http://localhost:8080/
```

### ⚠️ 重要な注意事項
- **CORS制限**: SVGファイルの読み込みのため、必ずHTTPサーバー経由でアクセスしてください
- **file://プロトコル非対応**: index.htmlを直接開いてもグラフィックは表示されません

## 🛠️ 開発者向け情報

### 開発ドキュメント
詳細な開発情報は以下のドキュメントを参照してください：

- 📋 [開発ガイド](docs/DEVELOPMENT_GUIDE.md) - セットアップとワークフロー
- 🏗️ [プロジェクト構造](docs/PROJECT_STRUCTURE.md) - ファイル構成の詳細
- 📐 [技術仕様](docs/TECHNICAL_SPECS.md) - アーキテクチャと技術詳細
- 📜 [Claudeルール](CLAUDE.md) - AI開発アシスタント用ガイドライン

### テスト実行
```bash
# 統合テストランナー（すべてのテストを実行）
node scripts/unified-test-runner.js

# 特定のカテゴリのみ実行
node scripts/unified-test-runner.js --category structure  # 構造テスト
node scripts/unified-test-runner.js --category unit       # ユニットテスト
node scripts/unified-test-runner.js --category automated  # 自動ゲームテスト

# ブラウザテスト（手動確認）
open http://localhost:8080/tests/test.html
```

## 🎨 ゲーム要素

### キャラクター
- **プレイヤー**: アニメーション付きキャラクター（待機、歩行、ジャンプ）
- **スライム**: 地上を移動する敵
- **鳥**: 空中を飛行する敵

### アイテム
- **コイン**: 10ポイント獲得
- **ジャンプ台**: 高くジャンプできる
- **ゴールフラッグ**: ステージクリア

### ステージ要素
- 様々な高さと幅のプラットフォーム
- 落下すると即死の穴
- 戦略的に配置された敵とアイテム

## 📊 技術スタック

- **言語**: JavaScript (ES6+), HTML5, CSS3
- **グラフィック**: Canvas API + SVG
- **音響**: Web Audio API
- **アーキテクチャ**: モジュラーオブジェクト指向設計
- **ビルドツール**: なし（バニラJavaScript）
- **依存関係**: なし（ゼロ依存）

## 🔄 更新履歴

### v1.2.0 (2025-06-19)
- コードベースの大規模リファクタリング
- モジュラー設計への移行
- テストカバレッジの向上
- ローディング状態の実装
- パフォーマンス最適化

### v1.1.0 (2025-06-18)
- SVGグラフィックシステムの実装
- 音楽システムの改善
- UIのモダン化

### v1.0.0 (2025-06-09)
- 初回リリース

## 🤝 貢献

バグ報告や機能提案は [Issues](https://github.com/becky3/coin-hunter-adventure/issues) からお願いします。

プルリクエストも歓迎します！開発に参加する場合は、[開発ガイド](docs/DEVELOPMENT_GUIDE.md)をご確認ください。

## 📄 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## 🙏 謝辞

- ゲームデザインのインスピレーション: クラシックプラットフォームゲーム
- 開発支援: Claude (Anthropic)
- テスター: コミュニティの皆様

---

🎮 **楽しいゲーム体験をお楽しみください！**

質問や提案がある場合は、お気軽に[Issue](https://github.com/becky3/coin-hunter-adventure/issues)を作成してください。