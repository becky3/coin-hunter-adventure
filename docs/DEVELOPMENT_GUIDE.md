# 開発ガイド

## セットアップ

### 必要な環境
- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）
- Python 3.x（HTTPサーバー用）
- Git
- GitHub CLI（gh）- PR作成用

### 初期セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/becky3/coin-hunter-adventure.git
cd coin-hunter-adventure

# HTTPサーバーの起動（バックグラウンド推奨）
nohup python3 -m http.server 8080 > server.log 2>&1 &

# ブラウザでアクセス
open http://localhost:8080/
```

## 開発フロー

### 1. 新機能の開発
```bash
# 最新のmainブランチを取得
git checkout main
git pull origin main

# 新しいブランチを作成
git checkout -b feature/新機能名

# HTTPサーバーを起動（バックグラウンド推奨）
nohup python3 -m http.server 8080 > server.log 2>&1 &
```

### 2. コーディング
- `src/`ディレクトリ内のファイルを編集
- ブラウザで動作確認（自動リロード）
- テストを実行して確認

#### デバッグツール
`debug/`ディレクトリには、開発・デバッグ用のHTMLファイルが用意されています：
- **check-game.html** - ゲームの基本動作確認用
- **debug-game.html** - デバッグ情報表示付きゲーム画面
- **error-check.html** - エラー検出とログ表示
- **test-game-init.html** - ゲーム初期化テスト

使用例：
```bash
# デバッグ画面にアクセス
http://localhost:8080/debug/debug-game.html
```

### 3. テスト実行

#### 統合テストランナー
```bash
# すべてのテストを実行
node scripts/unified-test-runner.js

# 特定のカテゴリのみ実行
node scripts/unified-test-runner.js --category structure    # 構造テスト
node scripts/unified-test-runner.js --category http        # HTTPサーバーテスト
node scripts/unified-test-runner.js --category integration # 統合テスト
node scripts/unified-test-runner.js --category automated   # 自動ゲームテスト
node scripts/unified-test-runner.js --category level       # レベル検証テスト
```

### 4. コミット
```bash
# 変更をステージング
git add -A

# コミット（日本語メッセージ）
git commit -m "feat: 新機能の説明"
```

### 5. プルリクエスト
```bash
# ブランチをプッシュ
git push origin feature/新機能名

# PRを作成
gh pr create --title "新機能の追加" --body "詳細な説明"
```

## テスト戦略

### 統合テストランナー
`scripts/unified-test-runner.js`を使用して、すべてのテストを一元管理：
- 構造テスト：ファイル存在確認、JSON妥当性チェック
- HTTPサーバーテスト：サーバー起動確認、アセット読み込み
- 統合テスト：包括的検証
- 自動ゲームテスト：ゲームプレイシミュレーション
- レベル検証テスト：レベルデータの妥当性確認

### 統合テスト
実際のゲームプレイで以下を確認：
- プレイヤーの操作性
- 敵との衝突判定
- アイテム収集
- ゲームクリア/ゲームオーバー

### 自動テスト
統合テストランナー経由で以下を検証：
- ゲーム状態管理
- プレイヤー動作
- 物理エンジン
- 衝突検出
- レベルデータ検証

## デバッグ方法

### ブラウザ開発者ツール
1. F12キーで開発者ツールを開く
2. Consoleタブでエラーを確認
3. Sourcesタブでブレークポイントを設定
4. Networkタブでファイル読み込みを確認

### よくある問題と解決策

#### SVGファイルが表示されない
- HTTPサーバーが起動しているか確認: `curl -I http://localhost:8080/`
- `file://`プロトコルではなく`http://`でアクセス
- ブラウザコンソールでCORSエラーを確認

#### HTTPサーバーが応答しない
- 既存のプロセスを終了: `pkill -f "python3 -m http.server"`
- サーバーを再起動: `nohup python3 -m http.server 8080 > server.log 2>&1 &`
- ポートが使用中の場合は別ポートを使用: `python3 -m http.server 8081`

#### JavaScriptの変更が反映されない
- Ctrl+F5（Cmd+Shift+R）で強制リロード
- 開発者ツールのNetworkタブで「Disable cache」を有効化
- キャッシュバスティングが機能しているか確認

#### テストが失敗する
- `config.js`の定数が変更されていないか確認
- 依存関係の読み込み順序を確認
- エラーメッセージを詳しく読む

## コード規約

### 命名規則
- 変数名: camelCase（例: `playerScore`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_SPEED`）
- クラス名: PascalCase（例: `GameState`）
- ファイル名: kebab-case（例: `game-state.js`）

### コメント
- 日本語でのコメントOK
- 複雑なロジックには必ずコメントを追加
- JSDocスタイルで関数の説明を記述

### エラーハンドリング
```javascript
// 良い例
if (!this.canvas) {
    throw new Error('gameCanvasが見つかりません');
}

// 悪い例（フォールバックは避ける）
this.canvas = document.getElementById('gameCanvas') || createFallbackCanvas();
```

## パフォーマンス最適化

### レンダリング
- 画面外のオブジェクトは描画しない（`isInView`チェック）
- アニメーションフレームの最適化
- 不要な再描画を避ける

### メモリ管理
- 使用済みオブジェクトの適切な削除
- イベントリスナーの解除
- 大きな配列の効率的な管理

## リリース手順

### バージョニング
- セマンティックバージョニングを使用
- major.minor.patch（例: 1.2.3）

### デプロイ
1. mainブランチにマージ
2. GitHubリリースを作成
3. 静的ホスティングサービスにデプロイ

## トラブルシューティング

### よくある質問

**Q: ゲームが起動しない**
A: ブラウザコンソールでエラーを確認し、HTTPサーバーが起動しているか確認

**Q: キャラクターが動かない**
A: 入力管理システムが正しく初期化されているか確認

**Q: 音が出ない**
A: ブラウザの自動再生ポリシーにより、ユーザー操作後に音が出るようになっています

## 参考リソース

- [MDN Web Docs](https://developer.mozilla.org/ja/)
- [Canvas API](https://developer.mozilla.org/ja/docs/Web/API/Canvas_API)
- [Web Audio API](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)