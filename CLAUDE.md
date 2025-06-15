# CLAUDE.md - プロジェクト開発ルール

## 会話開始時の必須操作

### HTTPサーバー起動
このプロジェクトはSVGファイルを外部読み込みするため、CORS制限により`file://`プロトコルでは正常に動作しません。

**会話開始時に必ずHTTPサーバーを起動してください：**

```bash
python3 -m http.server 8080
```

**アクセスURL:**
- メインゲーム: http://localhost:8080/
- テストページ: http://localhost:8080/tests/test.html

## プロジェクト構造

```
/
├── index.html              # メインゲームファイル
├── style.css               # ゲームスタイル
├── src/                    # メインソースファイル
│   ├── game.js                 # メインゲームロジック
│   ├── config.js               # ゲーム設定
│   ├── levels.js               # レベルデータ
│   ├── music.js                # 音楽システム
│   ├── player-graphics.js      # プレイヤーグラフィック
│   ├── svg-player-renderer.js  # プレイヤーSVGレンダラー
│   ├── svg-enemy-renderer.js   # 敵SVGレンダラー
│   ├── svg-item-renderer.js    # アイテムSVGレンダラー
│   └── svg-renderer.js         # 共通SVGレンダラー
├── assets/                 # ゲームアセット
│   ├── player-*.svg            # プレイヤーアニメーション
│   ├── slime.svg, bird.svg     # 敵キャラクター
│   └── coin.svg, flag.svg, spring.svg  # アイテム類
├── tests/                  # テストファイル
│   ├── test.html               # メインテストページ
│   └── [その他テストファイル]
└── docs/                   # ドキュメント
```

## 開発時の注意事項

1. **HTTPサーバー必須**: SVGファイル読み込みのため、必ずHTTPサーバー経由でアクセス
2. **パス参照**: ファイル移動時は相対パスの更新を忘れずに
3. **テスト実行**: 機能変更後は必ずテストページで動作確認
4. **コミット**: 破壊的変更は細かくコミットして履歴を残す

## テストコマンド

現在利用可能なテストコマンドは調査中です。package.jsonまたはREADME.mdを確認してください。