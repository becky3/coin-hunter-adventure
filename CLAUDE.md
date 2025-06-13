# Claude Development Rules

## 必須開発ワークフロー

### Issue作業開始前
1. **必ずIssueにコメントしてから作業開始**
   - GitHub CLIでコメント: `gh issue comment <issue-number> --body "作業を開始します"`
   - 作業内容と実装予定を明記

### PR作成前
2. **必ずテストを実行して成功確認**
   - Node.jsテスト: `npm test`
   - ブラウザテスト: `npm run test-browser` で環境確認後、ブラウザで確認
   - 全テストが通ることを確認

3. **リント実行（自動修正）**
   - `npm run lint` - ESLintを実行し、自動修正可能な問題を修正
   - `npm run lint:check` - 修正せずにチェックのみ実行
   - **注意**: コミット時に自動でlint-stagedが実行されます

### PR更新時
4. **必ずPRに対応内容をコメント追加（必須）**
   - 修正した問題の詳細説明
   - テスト結果の報告
   - 追加/変更したファイルの説明
   - **重要**: コミット後、必ずGitHub APIでPRコメントを追加

5. **Issue との紐づけ必須**
   - PR作成時に必ずIssue番号を指定してリンク
   - PRの本文に "Closes #<issue-number>" または "Fixes #<issue-number>" を含める
   - これによりGitHubのDevelopmentセクションに自動表示され、マージ時にIssueが自動クローズ
   - GitHub CLI スコープ制限がある場合は、Web UIでPR説明を手動編集

## GitHub CLI 実行手順（失敗防止）

### 必須手順
1. **正確なPR番号を確認**
   ```bash
   export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')"
   ./gh_2.40.1_linux_amd64/bin/gh pr list --repo becky3/coin-hunter-adventure
   ```

2. **PRコメント追加**
   ```bash
   # ステップ1: トークン設定とPR番号確認を同時実行
   export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh pr list --repo becky3/coin-hunter-adventure
   
   # ステップ2: 正確なPR番号でコメント投稿（例：PR番号27）
   export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh pr comment 27 --repo becky3/coin-hunter-adventure --body "コメント内容"
   ```

3. **Issue紐づけ確認（必須）**
   ```bash
   # ステップ1: Issue番号を確認
   export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue list --repo becky3/coin-hunter-adventure
   
   # ステップ2: PRの本文に "Closes #<issue-number>" が含まれているか確認
   export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh pr view 28 --repo becky3/coin-hunter-adventure --json body -q .body | grep -i "closes\|fixes"
   
   # ステップ3: 含まれていない場合はWeb UIで手動編集
   # https://github.com/becky3/coin-hunter-adventure/pull/<pr-number> でPR説明を編集
   ```

### よくある失敗とその対策
- **認証エラー**: GH_TOKEN環境変数が未設定 → トークン設定を必ず実行
- **PR番号エラー**: 古い番号や間違った番号 → 必ずpr listで最新番号を確認
- **リポジトリ指定エラー**: repo指定漏れ → --repo becky3/coin-hunter-adventureを必ず指定
- **PR編集スコープエラー**: `read:org`スコープ不足 → PRコメントでIssue紐づけ情報を追加

### コメント内容確認方法
3. **PRコメント内容確認（GitHub API直接使用）**
   ```bash
   # 最も確実な方法 - GitHub API直接アクセス
   curl -s "https://api.github.com/repos/becky3/coin-hunter-adventure/issues/<PR番号>/comments" | grep -A 5 -B 5 "body"
   
   # WebFetchが失敗する場合の代替手段
   # issuesエンドポイントを使用（PRもissueとして扱われる）
   ```

### WebFetch失敗時の対処法
- **WebFetch失敗**: GitHub URLアクセスが不安定 → GitHub API直接使用
- **スコープエラー**: gh CLIスコープ不足 → curl直接使用が確実
- **URL形式**: /pull/ と /issues/ は同じ番号でAPI利用可能

### テスト環境について

#### Node.jsベーステスト
- **コマンド**: `npm test`
- **内容**: ゲームロジック、設定、レベルデザインの検証
- **利点**: 高速、CI/CD対応、外部依存なし
- **制限**: DOM操作、実際の描画の検証不可

#### ブラウザベーステスト
- **環境確認**: `npm run test-browser`
- **実行**: ブラウザで `http://localhost:8080/test.html` を開く
- **内容**: 実際のゲーム動作、UI、描画の検証
- **利点**: 完全な統合テスト
- **制限**: 手動実行が必要

#### レベルテスト（簡易）
- **コマンド**: `npm run test-level`
- **内容**: レベル設計の静的解析と高速シミュレーション
- **実行時間**: 3秒以内
- **用途**: 日常的なレベル検証

## 🚨 テスト実行の必須ルール（Issue #29の教訓）

### コミット前の必須テスト手順
1. **すべてのテストファイルを実行**
   ```bash
   # 1. Node.jsベーステスト
   npm test
   
   # 2. ブラウザテスト環境の確認
   npm run test-browser
   # その後ブラウザで http://localhost:8080/test.html を開いて手動確認
   
   # 3. final-test.js（test.htmlと同等の検証）
   node final-test.js
   ```

2. **すべてのテストが成功することを確認**
   - npm test: ✅ X/X 成功
   - test.html: ✅ 手動で全項目成功確認
   - final-test.js: ✅ X/X 成功

3. **テスト失敗時の対応**
   - ❌ テスト失敗を無視してコミット・プッシュは禁止
   - ✅ 失敗原因を調査して修正後、再度全テスト実行

### テスト設計の重要原則

#### ✅ 推奨されるテスト
- **機能テスト**: クラス生成、メソッド動作、入力処理
- **存在チェック**: 必要な要素が存在するか
- **範囲チェック**: 値が妥当な範囲内にあるか
- **型チェック**: 値が期待する型か

#### ❌ 避けるべきテスト（ゲームバランス調整で頻繁に変更される値）
- **具体的な速度値**: `assertEquals(speed, 5)` → `assertGreaterThan(speed, 0)`
- **具体的な数量**: `assertEquals(enemies.length, 7)` → `assertGreaterThan(enemies.length, 0)`
- **具体的な座標**: `assertEquals(x, 2900)` → `assertGreaterThan(x, 2000)`
- **具体的なアニメーション速度**: `assertEquals(animSpeed, 0.2)` → 範囲チェック

#### テスト関数の使い分け
```javascript
// 厳密チェック（機能要件）
assertEquals(player.state, 'start');           // ✅ ゲーム状態
assertEquals(player.velX, 0);                  // ✅ 初期速度
assertEquals(player.velY, -PLAYER_CONFIG.jumpPower); // ✅ 動作チェック

// 範囲チェック（バランス要件）
assertGreaterThan(PLAYER_CONFIG.speed, 0);     // ✅ 速度は正の値
assertLessThan(PLAYER_CONFIG.speed, 20);       // ✅ 速度は現実的
assertGreaterThan(levelData.enemies.length, 0); // ✅ 敵は存在する

// 存在チェック（構造要件）
assert(Array.isArray(levelData.platforms));    // ✅ 配列として存在
assert(levelData.flag && typeof levelData.flag.x === 'number'); // ✅ ゴール存在
```

### コマンド一覧
```bash
# 基本テスト（必須）
npm test

# ブラウザテスト環境の確認
npm run test-browser

# レベルテスト（簡易・高速）
npm run test-level

# 開発サーバー起動
npm run serve

# リント（設定済み時）
npm run lint

# タイプチェック（設定済み時）
npm run typecheck
```

## GitHub CLI コマンド

### Issue操作
```bash
# Issue一覧確認（常に最新情報を取得）
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue list --repo becky3/coin-hunter-adventure

# Issue詳細確認
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue view <issue-number> --repo becky3/coin-hunter-adventure

# Issueにコメント
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue comment <issue-number> --repo becky3/coin-hunter-adventure --body "コメント内容"
```

### PR操作
```bash
# PR作成（テスト完了後、Issue紐づけ必須）
gh pr create --title "feat: 機能名 (Closes #<issue-number>)" --body "説明\n\nCloses #<issue-number>"

# 既存PRにIssue紐づけを追加
gh pr edit <pr-number> --body "$(gh pr view <pr-number> --json body -q .body)\n\nCloses #<issue-number>"

# PR一覧確認
gh pr list

# PR詳細確認
gh pr view <pr-number>
```

## 作業ルール

### 1. Issue選択と作業開始
1. **GitHubから最新のIssue情報を取得**
   - ローカルファイルの古い情報に依存しない
   - 常に `gh issue list` で最新状況を確認
   
2. **Issue作業前に必ずコメント**
   - 作業開始の宣言
   - 実装予定の説明

### 2. 開発とテスト
3. **実装前にテスト実行**
   - 既存機能の動作確認
   - ベースライン設定

4. **PR作成前にテスト成功確認（Issue #29の教訓）**
   - 全テストファイル実行必須: `npm test`, `test.html`, `node final-test.js`
   - 静的チェックではなく実際のテスト実行
   - 1つでも失敗している場合はPR作成禁止

### 3. PR管理
5. **PR更新時のコメント必須**
   - 何を修正したか
   - なぜ修正したか
   - テスト結果
   - 影響範囲

## PRコメントテンプレート

```markdown
## 🔧 [変更の種類] [概要]

### 修正した問題
1. **[問題1]**
   - 原因: [原因説明]
   - 対策: [対策説明]

2. **[問題2]**
   - 原因: [原因説明]
   - 対策: [対策説明]

### 📁 追加/変更ファイル
- **filename**: [変更内容]
- **filename**: [変更内容]

### ✅ テスト結果（必須：すべてのテストファイルを実行）
- ✅ **npm test**: X/X 成功
- ✅ **test.html**: 手動で全項目成功確認
- ✅ **node final-test.js**: X/X 成功
- ✅ **npm run lint**: 成功（利用可能な場合）
- ✅ **npm run typecheck**: 成功（利用可能な場合）

**重要**: 1つでもテストが失敗している場合はPR作成禁止

### 📝 備考
[追加の説明や注意事項]
```

## 🚨 開発運用で学んだ重要ルール（ハマりやすい問題回避）

### テスト設計の原則
1. **数量チェックの禁止**
   - ❌ `assertGreaterThan(enemies.length, 5)` - 敵の具体的な数をチェック
   - ❌ `assertEquals(coins.length, 30)` - コインの具体的な数をチェック
   - ✅ `assertGreaterThan(platforms.length, 0)` - プラットフォームの存在確認（ゲーム成立に必要）
   - **理由**: レベル調整で頻繁に変更される要素は柔軟にする

2. **配置位置の厳密チェック回避**
   - ❌ `assertEquals(spring.x, 650)` - 具体的な座標指定
   - ❌ `assertEquals(platform.width, 200)` - 具体的なサイズ指定
   - ✅ `assert(Array.isArray(springs))` - 要素の存在確認
   - **理由**: ゲームバランス調整で位置・サイズは変更される

3. **ゲームクリア必須要素のみテスト**
   - ✅ プラットフォーム存在（移動に必要）
   - ✅ ゴールフラグ存在（クリア条件）
   - ❌ 敵の数・種類（0体でもゲーム成立）
   - ❌ コインの数・配置（0個でもクリア可能）
   - ❌ スプリングの数・位置（ゲームクリアに必須ではない）

### フィードバック対応の手順
4. **視覚的問題の対応**
   - Step 1: 問題の具体的な座標・範囲を特定
   - Step 2: デバッグスクリプトで現状を数値化
   - Step 3: 最小限の調整で問題解決
   - Step 4: 調整後の数値を確認・テスト

5. **動作問題の対応**
   - Step 1: 問題となる条件を再現
   - Step 2: ログ出力で動作フローを確認
   - Step 3: 競合するロジックがないか確認
   - Step 4: 1つのロジックに統一

### コミット・PR戦略
6. **テスト失敗時の対応**
   - ❌ テスト失敗を無視してプッシュ
   - ✅ テスト修正 → 全テスト成功確認 → コミット
   - **必須**: `npm test`実行後の成功確認

7. **コミット前の自動lint実行**
   - huskyによるpre-commitフックが自動実行
   - lint-stagedでステージングされたJSファイルをチェック
   - 自動修正可能な問題は自動で修正
   - 修正できない問題がある場合はコミット中止
   - **回避方法**: `git commit --no-verify`（非推奨）

8. **PR更新時のコメント必須化**
   - 何を修正したか（What）
   - なぜ修正したか（Why）
   - テスト結果の報告
   - **重要**: コミット後、必ずGitHub APIでPRコメントを追加
   - **目的**: レビュアーの理解促進とトレーサビリティ確保
   - **忘れやすい作業**: コミット後のPRコメント追加を必ず実行する

## 📚 関連ドキュメント
- `GAME_RULES.md`: ゲーム実装ルール（敵の動作、レベル設計など）