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

3. **リントとタイプチェック実行**
   - `npm run lint`
   - `npm run typecheck`

### テスト環境について

#### Node.jsベーステスト
- **コマンド**: `npm test`
- **内容**: ゲームロジック、設定、レベルデザインの検証
- **利点**: 高速、CI/CD対応、外部依存なし
- **制限**: DOM操作、実際の描画の検証不可

#### ブラウザベーステスト
- **環境確認**: `npm run test-browser`
- **実行**: ブラウザで `http://localhost:8081/test.html` を開く
- **内容**: 実際のゲーム動作、UI、描画の検証
- **利点**: 完全な統合テスト
- **制限**: 手動実行が必要

### コマンド一覧
```bash
# 基本テスト（必須）
npm test

# ブラウザテスト環境の確認
npm run test-browser

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
# Issue一覧確認
gh issue list

# Issue詳細確認
gh issue view <issue-number>

# Issueにコメント
gh issue comment <issue-number> --body "コメント内容"
```

### PR操作
```bash
# PR作成（テスト完了後）
gh pr create --title "タイトル" --body "説明"

# PR一覧確認
gh pr list

# PR詳細確認
gh pr view <pr-number>
```

## 作業ルール
1. Issue作業前に必ずコメント
2. 実装前にテスト実行
3. PR作成前にテスト成功確認
4. 静的チェックではなく実際のテスト実行