#!/bin/bash
# GitHub API直接使用でPRコメント投稿

PR_NUMBER=${1:-18}
COMMENT_FILE=${2:-"pr-update-comment.md"}

if [ ! -f "$COMMENT_FILE" ]; then
    echo "エラー: コメントファイル '$COMMENT_FILE' が見つかりません"
    exit 1
fi

echo "PR #${PR_NUMBER} にコメントを投稿しています..."

# コメント内容を読み取り、JSONエスケープ
COMMENT_BODY=$(cat "$COMMENT_FILE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# GitHub API経由でコメント投稿
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/becky3/coin-hunter-adventure/issues/${PR_NUMBER}/comments \
  -d "{\"body\":\"$COMMENT_BODY\"}"

if [ $? -eq 0 ]; then
    echo -e "\n✅ PRコメントの投稿が完了しました"
else
    echo -e "\n❌ PRコメントの投稿に失敗しました"
    exit 1
fi