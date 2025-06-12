#!/bin/bash
# GitHub PR自動コメントスクリプト

# GitHub CLIのPATHを設定
export PATH="$PWD/gh_2.40.1_linux_amd64/bin:$PATH"

# トークンチェック
if [ -z "$GH_TOKEN" ]; then
    echo "エラー: GH_TOKEN環境変数が設定されていません"
    echo "以下のコマンドでトークンを設定してください:"
    echo "export GH_TOKEN=your_token_here"
    exit 1
fi

# PR番号とコメントファイルをパラメータで受け取る
PR_NUMBER=${1:-18}
COMMENT_FILE=${2:-"pr-update-comment.md"}

if [ ! -f "$COMMENT_FILE" ]; then
    echo "エラー: コメントファイル '$COMMENT_FILE' が見つかりません"
    exit 1
fi

echo "PR #${PR_NUMBER} にコメントを投稿しています..."

# GitHub APIでコメント投稿
gh api repos/:owner/:repo/issues/${PR_NUMBER}/comments \
    -X POST \
    --field body@"$COMMENT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ PRコメントの投稿が完了しました"
else
    echo "❌ PRコメントの投稿に失敗しました"
    exit 1
fi