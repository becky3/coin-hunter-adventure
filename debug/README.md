# Debug Directory

このディレクトリには、開発・デバッグ用のHTMLファイルが含まれています。

## ファイル一覧

- **check-game.html** - ゲームの基本動作確認用
- **debug-game.html** - デバッグ情報表示付きゲーム画面
- **error-check.html** - エラー検出とログ表示
- **test-game-init.html** - ゲーム初期化テスト

## 使い方

1. HTTPサーバーを起動
```bash
nohup python3 -m http.server 8080 > server.log 2>&1 &
```

2. ブラウザでアクセス
```
http://localhost:8080/debug/debug-game.html
```

## 注意事項

これらのファイルは開発・デバッグ専用です。本番環境では使用しないでください。