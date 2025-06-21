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

# HTTPサーバーテスト（サーバー起動確認）
node scripts/unified-test-runner.js --category http

# 統合テスト（comprehensive-test-results）
node scripts/unified-test-runner.js --category integration

# 自動ゲームテスト（run-automated-tests）
node scripts/unified-test-runner.js --category automated

# レベル検証テスト（level-validation-test）
node scripts/unified-test-runner.js --category level
```

## テストカテゴリ

### 1. 構造テスト (structure)
- 必要なファイルの存在確認
- JSONファイルの妥当性チェック
- プロジェクト構造の検証

### 2. HTTPサーバーテスト (http)
- HTTPサーバーの起動確認
- CORS制限の回避確認
- 開発環境の前提条件チェック

### 3. 統合テスト (integration)
- 包括的なテスト結果の生成
- インフラストラクチャ検証
- JavaScript実行環境の確認

### 4. 自動ゲームテスト (automated)
- ゲーム状態管理のテスト
- プレイヤー動作の検証
- 物理エンジンと衝突検出のテスト

### 5. レベル検証テスト (level)
- レベルデータの妥当性確認
- プラットフォーム配置の検証
- ゴール到達可能性のチェック

## 出力形式

### 出力ルール

1. **環境情報の表示**
   - Node.jsバージョン
   - プラットフォーム
   - 作業ディレクトリ

2. **テストカテゴリの表示**
   - 形式: `[カテゴリ番号/総カテゴリ数] カテゴリ名を実行中...`
   - 例: `[1/5] 構造テストを実行中...`

3. **個別テスト結果の表示**
   - 形式: `[カテゴリ番号.テスト番号] ✅/❌ テスト名 : エラー理由（失敗時のみ）`
   - 成功例: `[1.1] ✅ ファイル存在確認: index.html`
   - 失敗例: `[4.1] ❌ インフラストラクチャ検証 : モジュールが見つかりません`

4. **結果サマリーの表示**
   - 総テスト数、成功数、失敗数、スキップ数
   - 成功率（パーセンテージ）
   - 実行時間

5. **失敗したテストの一覧**
   - 失敗したテストがある場合のみ表示
   - 番号、テスト名、エラー理由を含む

### 表示順序

1. 開始メッセージと環境情報
2. 各カテゴリのテスト実行と結果
3. 区切り線
4. テスト結果サマリー
5. 区切り線
6. 失敗したテストの一覧（該当する場合）
7. 結果ファイルの保存パス

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
    "http": {
      "passed": 1,
      "failed": 0,
      "serverRunning": true
    },
    "integration": {
      "passed": 5,
      "failed": 0,
      "output": "...",
      "exitCode": 0
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