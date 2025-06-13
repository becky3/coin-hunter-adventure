# 📋 次回会話への引き継ぎ情報

## 🎯 現在の状況
**プロジェクト**: コインハンターアドベンチャー (becky3/coin-hunter-adventure)
**現在のブランチ**: `feature/adjust-character-speed-issue-29`（作業完了、マージ済み）
**状態**: 次回のIssue選択待ち

## ✅ 最近の主な完了項目
1. **キャラクター動作速度の調整**
   - プレイヤー速度: 5 → 3.5（30%減速）
   - 敵の速度: 30%減速（スライム: 1→0.7、鳥: 2→1.4）
   - ジャンプ力調整: 18 → 15、重力: 0.8 → 0.65
   - アニメーション速度改善（見やすさ向上）

2. **テスト体系の根本的改善（重要な教訓）**
   - 全テストファイルでハードコード値を柔軟な範囲チェックに変更
   - npm test, test.html, final-test.js すべて対応
   - ゲームバランス調整でテストが失敗しない設計に変更
   - CLAUDE.mdにテスト実行ルールと設計原則を明記

3. **プレイヤーグラフィック大幅改善**
   - 横向きキャラクターデザイン実装
   - 健康状態による色変更（青/ピンク服、緑/オレンジ帽子）
   - アニメーション対応（待機、歩行、ジャンプ）
   - player-graphics.js、svg-player-renderer.js 作成

4. **SVGファイル準備完了**
   - プレイヤー用: player-idle.svg, player-walk1.svg, player-walk2.svg, player-jump.svg
   - 敵・オブジェクト用: slime.svg, bird.svg, coin.svg, flag.svg, spring.svg
   - 統合レンダラー: svg-renderer.js（将来拡張用）

5. **開発ワークフロー確立**
   - CLAUDE.md に完全な開発ルール記載
   - Issue-PR紐づけ、テスト、コメント追加の自動化

## 🚨 判明した課題
1. **SVG統合システム**: 複雑すぎてプレイヤー表示に問題発生 → 別タスクで慎重実装予定
2. **GitHub CLI制限**: `read:org`スコープ不足でPR編集不可 → Web UI手動編集で対応

## 📂 重要ファイル構成
```
/mnt/d/claude/testAction/
├── CLAUDE.md (開発ルール - 最重要)
├── HANDOVER.md (この引き継ぎファイル)
├── game.js (メインゲーム)
├── player-graphics.js (プレイヤー描画)
├── svg-player-renderer.js (SVG読み込み)
├── player-*.svg (プレイヤーSVG 4種)
├── *.svg (敵・オブジェクト SVG 5種)
├── config.js, levels.js, music.js
└── index.html
```

## 🎮 現在のゲーム状態
- **プレイヤー**: 横向き、健康状態色変更、アニメーション対応
- **敵**: スライム・鳥（従来グラフィック維持）
- **テスト**: 全9項目パス、ブラウザ動作確認済み
- **機能**: ジャンプ、移動、衝突判定、音楽すべて正常

## 📋 次回作業のIssue選択方法
```bash
# 最新のIssue一覧を取得
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue list --repo becky3/coin-hunter-adventure

# 特定のIssueの詳細を確認
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue view <issue-number> --repo becky3/coin-hunter-adventure
```

**選択基準**:
- 優先度と緊急度を考慮
- 実装難易度と時間を考慮  
- ユーザビリティへの影響度を考慮

## 🛠️ 必須の作業開始手順（CLAUDE.mdより）
```bash
# 1. Issue作業開始前コメント
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh issue comment <issue-number> --repo becky3/coin-hunter-adventure --body "作業を開始します"

# 2. テスト実行（必須）
npm test

# 3. ブラウザテスト確認
npm run test-browser

# 4. コミット・プッシュ後のPRコメント追加（必須）
export GH_TOKEN="$(git config --get remote.origin.url | grep -o 'ghp_[^@]*')" && ./gh_2.40.1_linux_amd64/bin/gh pr comment <pr-number> --repo becky3/coin-hunter-adventure --body "詳細コメント"

# 5. Issue-PR紐づけ確認（必須）
# PR本文に "Closes #<issue-number>" 含まれているかチェック
```

## ⚠️ 重要な注意事項

### テスト実行について（Issue #29の重要な教訓）
- **全テストファイル実行必須**: PR作成前に必ず以下を実行
  ```bash
  npm test                    # Node.jsベーステスト
  npm run test-browser        # ブラウザテスト環境確認
  # ブラウザで http://localhost:8080/test.html を開いて手動確認
  node final-test.js          # test.htmlと同等の検証
  ```
- **1つでもテスト失敗時はPR作成禁止**: 必ず修正してから作業続行
- **テスト設計**: ゲームバランス値（速度、数量）は範囲チェック、機能は厳密チェック

### その他の注意事項
- **SVG統合は避ける**: 前回複雑化でプレイヤー表示破損したため
- **CLAUDE.md厳守**: Issue開始コメント、テスト、PRコメント、Issue紐づけは必須
- **ブランチ作成**: 新しいIssue作業時は新ブランチ作成

## 🎯 次回作業開始の手順
1. **最新のIssue情報を取得** - GitHubから最新の一覧と詳細を確認
2. **優先度を考慮して選択** - ユーザビリティと実装難易度を評価
3. **作業開始前の準備** - Issue開始コメント、ブランチ作成

## 📞 次回会話の開始方法
1. この`HANDOVER.md`ファイルを最初に読む
2. `CLAUDE.md`で開発ルールを確認
3. 現在のテスト状況を確認: `npm test`
4. **GitHub CLIで最新のIssue一覧を取得し選択**
5. 選択したIssueの詳細を確認
6. Issue開始コメントを実行
7. 新ブランチ作成して作業開始

---
**作成日**: 2025-06-13
**最終更新**: Issue #29 完了、テスト体系改善実施
**ステータス**: 安定稼働中、テスト体系確立完了、次回タスク選択可能