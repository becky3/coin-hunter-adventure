# テストファースト・アーキテクチャ

## 概要

Issue #43に対応して、Claudeが自動的にゲーム動作を検証できるテストファースト構造を実装しました。これにより、ユーザーの手動確認を最小限に抑えながら、高品質なゲーム開発が可能になります。

## 新しいコンポーネント

### 1. GameStateManager (`src/game-state-manager.js`)

ゲーム状態のキャプチャと検証を行うシステム：

- **状態スナップショット**: ゲームの任意の時点での完全な状態を記録
- **状態履歴**: 最大1000フレームまでの状態変化を追跡
- **状態比較**: 期待値と実際の状態を比較検証
- **イベント記録**: 重要なゲームイベントを記録

```javascript
// 使用例
const stateManager = new GameStateManager();
stateManager.startRecording();
// ゲームプレイ...
const history = stateManager.stopRecording();
const analysis = stateManager.analyzeHistory();
```

### 2. AutomatedTestPlayer (`src/automated-test-player.js`)

ゲームを自動的にプレイしてテストシナリオを実行：

- **アクションシーケンス**: 移動、ジャンプ、待機などの自動実行
- **条件待機**: 特定の状態になるまで待機
- **アサーション**: ゲーム状態の自動検証
- **プリセットシナリオ**: 一般的なテストケースを内蔵

```javascript
// 使用例
const testPlayer = new AutomatedTestPlayer(game, stateManager);
await testPlayer.executeSequence(AutomatedTestPlayer.scenarios.basicMovement);
```

### 3. TestExpectations (`src/test-expectations.js`)

テストの期待値を定義・管理：

- **カテゴリ別期待値**: 移動、ジャンプ、衝突などの期待値定義
- **許容範囲**: 物理計算の誤差を考慮した柔軟な検証
- **カスタム期待値**: プロジェクト固有の期待値追加

### 4. TestReporter (`src/test-reporter.js`)

多様な形式でテスト結果を出力：

- **コンソール形式**: 開発時の即時確認
- **JSON形式**: プログラムでの処理
- **Markdown形式**: ドキュメント化
- **JUnit XML形式**: CI/CD統合

## 自動テストスイート

### テストカテゴリ

1. **ゲーム状態管理** (3テスト)
   - 状態キャプチャの正確性
   - 状態履歴の記録
   - 状態検証機能

2. **プレイヤー動作** (3テスト)
   - 右移動の検証
   - ジャンプ動作の検証
   - 複合動作の検証

3. **ゲームメカニクス** (2テスト)
   - コイン収集メカニクス
   - ライフシステム

4. **物理エンジン** (2テスト)
   - 重力の適用
   - 速度制限の確認

5. **衝突検出** (2テスト)
   - プラットフォーム衝突
   - 境界チェック

### 実行方法

#### ブラウザでの実行
```bash
# HTTPサーバーが起動している状態で
open http://localhost:8080/tests/automated-test.html
```

#### Node.jsでの実行
```bash
node scripts/run-automated-tests.js
```

#### 特定カテゴリのみ実行
```javascript
const tester = new AutomatedGameTests();
const results = await tester.runCategoryTests('player-movement');
```

## テスト結果の活用

### 自動生成される情報

1. **テスト結果サマリー**
   - 成功/失敗数
   - 成功率
   - 実行時間

2. **詳細統計**
   - カテゴリ別結果
   - 最速/最遅テスト
   - 平均実行時間

3. **失敗分析**
   - エラーメッセージ
   - 期待値と実際値の差分
   - スタックトレース

### CI/CD統合

```yaml
# GitHub Actions例
- name: Run Automated Tests
  run: |
    npm install
    node scripts/run-automated-tests.js
  
- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: automated-test-results.json
```

## 今後の拡張計画

### フェーズ1（完了）
- ✅ 基本的な自動テストフレームワーク
- ✅ ゲーム状態の管理システム
- ✅ 自動プレイヤーシステム
- ✅ 複数形式でのレポート出力

### フェーズ2（計画中）
- ビジュアル回帰テスト（スクリーンショット比較）
- パフォーマンステスト（FPS、メモリ使用量）
- エンドツーエンドシナリオテスト
- テストカバレッジ測定

### フェーズ3（将来）
- AIによるテストシナリオ自動生成
- 異常系の自動検出
- クロスブラウザテスト自動化
- モバイル環境での自動テスト

## 設定ファイル

`test-config.json`でテストの詳細な設定が可能：

```json
{
  "automated-tests": {
    "enabled": true,
    "categories": {
      "player-movement": {
        "enabled": true,
        "priority": "high",
        "timeout": 10000
      }
    }
  }
}
```

## まとめ

この新しいテストファースト構造により：

1. **Claudeの自律性向上**: 手動確認なしで多くの検証が可能
2. **開発効率の向上**: 自動テストによる迅速なフィードバック
3. **品質の保証**: 包括的なテストカバレッジ
4. **CI/CD対応**: 自動化されたビルドパイプライン

ユーザーは主に以下の場合のみ確認が必要：
- ビジュアルデザインの評価
- ゲームプレイの楽しさ
- パフォーマンスの体感
- 新機能の最終確認