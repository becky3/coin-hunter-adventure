# プロジェクト構造

## ディレクトリ構成

```
coin-hunter-adventure/
├── index.html              # メインゲームエントリーポイント
├── style.css               # ゲームのスタイルシート
├── favicon.svg             # ファビコン
├── CLAUDE.md               # Claude用開発ルール
├── README.md               # プロジェクト概要
│
├── src/                    # ソースコード
│   ├── game.js                 # メインゲームクラス
│   ├── config.js               # ゲーム設定定数
│   ├── levels.js               # レベルデータ定義（未使用）
│   ├── level-loader.js         # レベルローダー
│   ├── music.js                # 音楽・効果音システム
│   ├── player.js               # プレイヤークラス
│   ├── input-manager.js        # 入力管理システム
│   ├── game-state.js           # ゲーム状態管理
│   ├── score-animation.js      # スコアアニメーション
│   ├── player-graphics.js      # プレイヤーグラフィック定義
│   ├── svg-graphics.js         # SVGグラフィックシステム
│   ├── svg-renderer.js         # 基本SVGレンダラー
│   ├── svg-player-renderer.js  # プレイヤーSVGレンダラー
│   ├── svg-enemy-renderer.js   # 敵キャラクターSVGレンダラー
│   ├── svg-item-renderer.js    # アイテムSVGレンダラー
│   ├── automated-test-player.js    # 自動テスト用プレイヤー
│   ├── game-state-manager.js       # ゲーム状態記録システム
│   ├── test-expectations.js        # テスト期待値定義
│   └── test-reporter.js            # テストレポート生成
│
├── assets/                 # ゲームアセット
│   ├── player-idle.svg         # プレイヤー待機アニメーション
│   ├── player-walk1.svg        # プレイヤー歩行アニメーション1
│   ├── player-walk2.svg        # プレイヤー歩行アニメーション2
│   ├── player-jump.svg         # プレイヤージャンプアニメーション
│   ├── player-fall.svg         # プレイヤー落下アニメーション
│   ├── slime.svg               # スライム敵キャラクター
│   ├── bird.svg                # 鳥敵キャラクター
│   ├── coin.svg                # コインアイテム
│   ├── flag.svg                # ゴールフラッグ
│   └── spring.svg              # ジャンプ台
│
├── levels/                 # レベルデータ
│   ├── stages.json             # ステージリスト
│   └── stage1.json             # ステージ1データ
│
├── tests/                  # テストファイル
│   ├── automated-test.html     # 自動テストHTML
│   └── snapshots/              # Canvasスナップショットベースライン
│
├── scripts/                # 開発・検証スクリプト
│   ├── README.md               # スクリプトディレクトリの説明
│   ├── runners/                # テストランナー
│   │   ├── unified-test-runner.js  # 統合テストランナー
│   │   ├── run-automated-tests.js  # 自動ゲームテスト
│   │   └── visual-test-runner.js   # ビジュアルテストランナー
│   ├── validators/             # 検証・分析ツール
│   │   ├── canvas-snapshot-test.js # Canvasスナップショットテスト
│   │   ├── coverage-analyzer.js    # カバレッジ分析
│   │   ├── error-monitor.js        # エラー監視
│   │   └── level-validation-test.js # レベル検証
│   ├── utils/                  # ユーティリティ
│   │   ├── comprehensive-test-results.js # 包括的検証
│   │   ├── server-check.js         # HTTPサーバー確認
│   │   └── ...その他のユーティリティ
│   └── examples/               # サンプル・実験的スクリプト
│
├── debug/                  # デバッグ・開発用ツール
│   ├── README.md               # デバッグツールの説明
│   ├── check-game.html         # ゲームの基本動作確認用
│   ├── debug-game.html         # デバッグ情報表示付きゲーム画面
│   ├── error-check.html        # エラー検出とログ表示
│   └── test-game-init.html     # ゲーム初期化テスト
│
├── docs/                   # プロジェクトドキュメント
│   ├── PROJECT_STRUCTURE.md        # このファイル
│   ├── DEVELOPMENT_GUIDE.md        # 開発ガイド
│   ├── TECHNICAL_SPECS.md          # 技術仕様
│   └── TEST_GUIDE.md               # 包括的なテストガイド
│
└── docs-old-gh-pages/      # 旧GitHub Pagesドキュメント（メンテナンス停止）
```

## 主要ファイルの説明

### エントリーポイント
- **index.html**: ゲームのメインHTML。キャッシュバスティング機能付き
- **style.css**: モダンなUIデザインを実現するスタイルシート

### コアシステム（src/）
- **game.js**: ゲームループ、衝突判定、レンダリングを管理するメインクラス
- **config.js**: ゲーム全体で使用する定数（キャンバスサイズ、物理定数など）
- **player.js**: プレイヤーの状態、移動、アニメーションを管理
- **input-manager.js**: キーボード入力を一元管理
- **game-state.js**: スコア、ライフ、タイマーなどのゲーム状態を管理
- **music.js**: Web Audio APIを使用した動的な音楽・効果音システム

### グラフィックシステム（src/svg-*.js）
- **svg-graphics.js**: SVGレンダリングの統合管理
- **svg-renderer.js**: 基本的な形状描画（プラットフォーム、背景など）
- **svg-player-renderer.js**: プレイヤーのSVGアニメーション管理
- **svg-enemy-renderer.js**: 敵キャラクターのレンダリング
- **svg-item-renderer.js**: アイテム（コイン、フラッグ、スプリング）のレンダリング

### レベルシステム（levels/）
- **stages.json**: 利用可能なステージのリスト
- **stage1.json**: ステージ1の詳細データ（プラットフォーム、敵、アイテムの配置）

### テストシステム（tests/, scripts/）
- **scripts/runners/unified-test-runner.js**: すべてのテストを一元管理する統合ランナー
- **tests/automated-test.html**: 自動ゲームプレイテスト
- **scripts/validators/**: 各種検証・分析ツール
- **scripts/utils/**: テスト用ユーティリティ
- **tests/snapshots/**: Canvasレンダリングのベースラインデータ

### デバッグツール（debug/）
- **debug-game.html**: リアルタイムデバッグ情報付きゲーム画面
- **error-check.html**: エラー検出と詳細ログ表示
- **check-game.html**: 基本動作確認用のシンプルな画面

## 依存関係

### スクリプト読み込み順序（index.html）
1. config.js - グローバル定数
2. levels.js - レベルデータ（未使用）
3. level-loader.js - レベル読み込み
4. music.js - 音楽システム
5. player-graphics.js - プレイヤーグラフィック定義
6. svg-renderer.js - 基本レンダラー
7. svg-player-renderer.js - プレイヤーレンダラー
8. svg-enemy-renderer.js - 敵レンダラー
9. svg-item-renderer.js - アイテムレンダラー
10. svg-graphics.js - 統合グラフィックシステム
11. game-state.js - 状態管理
12. score-animation.js - アニメーション
13. player.js - プレイヤークラス
14. input-manager.js - 入力管理
15. game.js - メインゲームクラス

### 外部依存
- なし（純粋なバニラJavaScript）

## ビルド・デプロイ

### 開発環境
```bash
# HTTPサーバー起動（CORS回避のため必須）
python3 -m http.server 8080

# アクセス
http://localhost:8080/
```

### 本番環境
- 静的ファイルをそのままホスティング
- 特別なビルドプロセスは不要
- キャッシュバスティングはlocalhost環境でのみ有効

## 設定とカスタマイズ

### ゲーム設定（src/config.js）
- `CANVAS_WIDTH`, `CANVAS_HEIGHT`: 画面サイズ
- `GRAVITY`: 重力加速度
- `PLAYER_CONFIG`: プレイヤーパラメータ
- `ENEMY_CONFIG`: 敵キャラクターパラメータ
- `COIN_CONFIG`, `SPRING_CONFIG`: アイテムパラメータ

### レベル編集（levels/stage1.json）
- `platforms`: プラットフォームの配置
- `enemies`: 敵の初期位置と種類
- `coins`: コインの配置
- `springs`: ジャンプ台の配置
- `goal`: ゴール地点