# 統合テストランナー

## 概要

統合テストランナーは、プロジェクト内のすべてのテストを一元管理し、単一のコマンドで実行できるツールです。

## 特徴

- **一元管理**: 分散していたテストツールを統合
- **カテゴリ別実行**: 必要なテストのみを選択して実行可能
- **詳細なレポート**: JSON形式での結果保存とコンソール出力
- **CI/CD対応**: exit codeによる成功/失敗の判定

## 使用方法

### すべてのテストを実行

```bash
node scripts/unified-test-runner.js
```

### 特定のカテゴリのみ実行

```bash
# 構造テスト（ファイル存在確認、JSON妥当性）
node scripts/unified-test-runner.js --category structure

# ユニットテスト（curl-test-validator）
node scripts/unified-test-runner.js --category unit

# 統合テスト（comprehensive-test-results）
node scripts/unified-test-runner.js --category integration

# 自動ゲームテスト（run-automated-tests）
node scripts/unified-test-runner.js --category automated
```

## テストカテゴリ

### 1. 構造テスト (structure)
- 必要なファイルの存在確認
- JSONファイルの妥当性チェック
- プロジェクト構造の検証

### 2. ユニットテスト (unit)
- HTTPリクエストベースの検証
- テストページの構造確認
- スクリプトの読み込み確認

### 3. 統合テスト (integration)
- 包括的なテスト結果の生成
- 複数のテストツールの統合実行

### 4. 自動ゲームテスト (automated)
- ゲーム状態管理のテスト
- プレイヤー動作の検証
- 物理エンジンと衝突検出のテスト

## 出力形式

### コンソール出力

```
🚀 統合テストランナーを開始します...

環境情報:
  Node.js: v16.14.0
  Platform: linux
  作業ディレクトリ: /path/to/project

📁 [1/5] 構造テストを実行中...
🌐 [2/5] HTTPサーバーの確認中...
🧪 [3/5] ユニットテストを実行中...
🔗 [4/5] 統合テストを実行中...
🎮 [5/5] 自動ゲームテストを実行中...

============================================================
📊 テスト結果サマリー
============================================================
総テスト数: 50
✅ 成功: 45
❌ 失敗: 5
⏭️  スキップ: 0
成功率: 90.0%
実行時間: 30.50秒
============================================================
```

### JSON出力

結果は `unified-test-results.json` に保存されます：

```json
{
  "timestamp": "2025-06-20T12:00:00.000Z",
  "environment": {
    "node": "v16.14.0",
    "platform": "linux",
    "cwd": "/path/to/project"
  },
  "tests": {
    "structure": {
      "passed": 9,
      "failed": 0,
      "tests": [...]
    },
    "unit": {
      "passed": 10,
      "failed": 1,
      "output": "...",
      "exitCode": 1
    }
  },
  "summary": {
    "total": 50,
    "passed": 45,
    "failed": 5,
    "skipped": 0,
    "duration": 30500,
    "successRate": "90.0"
  }
}
```

## エラーハンドリング

- HTTPサーバーが起動していない場合は警告を表示
- タイムアウト設定（60秒）で無限ループを防止
- 各テストの失敗は他のテストに影響しない

## CI/CD統合

```yaml
# GitHub Actions の例
- name: Run tests
  run: |
    python3 -m http.server 8080 &
    sleep 3
    node scripts/unified-test-runner.js
```

exit codeは以下の通り：
- `0`: すべてのテストが成功
- `1`: 1つ以上のテストが失敗

## トラブルシューティング

### HTTPサーバーエラー
```
❌ HTTPサーバーが起動していません
```
→ `python3 -m http.server 8080` を実行してください

### モジュールが見つからない
```
Error: Cannot find module 'xxx'
```
→ `npm install` を実行して依存関係をインストールしてください

### タイムアウトエラー
```
テストがタイムアウトしました
```
→ 個別のテストスクリプトに問題がある可能性があります