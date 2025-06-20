# 技術仕様

## システム要件

### 動作環境
- **ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES6+対応
- **画面解像度**: 1024x576px以上推奨

### 開発環境
- **HTTPサーバー**: Python 3.x, Node.js, またはその他
- **Node.js**: 14.x以上（テストツール実行用）
- **Git**: 2.x以上

## アーキテクチャ

### 全体構成
```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   HTML/CSS  │ ──> │  JavaScript  │ ──> │ Canvas/SVG    │
│  (UI層)     │     │ (ロジック層) │     │ (描画層)      │
└─────────────┘     └──────────────┘     └───────────────┘
```

### モジュール構成
- **Game**: メインゲームループとシーン管理
- **Player**: プレイヤーの状態と動作
- **InputManager**: 入力の一元管理
- **GameState**: ゲーム全体の状態管理
- **MusicSystem**: 音楽と効果音の管理
- **SVGGraphics**: グラフィックレンダリング

## 技術詳細

### Canvas API
- **解像度**: 1024x576px（16:9）
- **座標系**: 左上が原点(0,0)
- **レンダリング**: 60FPS目標

### 物理エンジン
```javascript
// 重力計算
const GRAVITY = 0.5;
player.velY += GRAVITY;
player.y += player.velY;

// 摩擦
const FRICTION = 0.85;
player.velX *= FRICTION;
```

### 衝突判定
```javascript
// AABB（軸平行境界ボックス）方式
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

### SVGレンダリング
- **外部SVGファイル**: fetch APIで読み込み
- **キャッシュ**: Mapオブジェクトで管理
- **フォールバック**: SVG読み込み失敗時はCanvas描画

### 音楽システム
```javascript
// Web Audio APIを使用した動的音生成
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
```

## データ構造

### プレイヤーデータ
```javascript
{
    x: number,          // X座標
    y: number,          // Y座標
    width: number,      // 幅
    height: number,     // 高さ
    velX: number,       // X方向速度
    velY: number,       // Y方向速度
    health: number,     // 体力
    onGround: boolean,  // 接地判定
    facing: number,     // 向き（-1:左, 1:右）
    invulnerable: boolean,      // 無敵状態
    invulnerabilityTime: number // 無敵時間
}
```

### レベルデータ形式
```json
{
    "id": "stage1",
    "name": "ステージ名",
    "worldWidth": 3000,
    "worldHeight": 576,
    "playerSpawn": { "x": 100, "y": 300 },
    "goal": { "x": 2900, "y": 396 },
    "platforms": [
        { "x": 0, "y": 476, "width": 400, "height": 100 }
    ],
    "enemies": [
        { "type": "slime", "x": 350, "y": 436 }
    ],
    "coins": [
        { "x": 100, "y": 440 }
    ],
    "springs": [
        { "x": 1100, "y": 436 }
    ]
}
```

## パフォーマンス

### 最適化技術
1. **視界外カリング**: カメラ範囲外のオブジェクトは描画しない
2. **オブジェクトプーリング**: パーティクルなどの再利用
3. **requestAnimationFrame**: ブラウザ最適化されたレンダリング

### メモリ管理
- **リソース解放**: destroy()メソッドで適切にクリーンアップ
- **イベントリスナー**: hasListenerフラグで重複登録防止
- **配列管理**: splice()で不要な要素を削除

## セキュリティ

### CORS対策
- **開発環境**: HTTPサーバー必須（`file://`プロトコル禁止）
- **本番環境**: 同一オリジンポリシーに準拠

### 入力検証
- **キー入力**: ホワイトリスト方式で許可されたキーのみ処理
- **数値範囲**: 座標値の妥当性チェック

## 制限事項

### 技術的制限
1. **Canvas操作**: Node.js環境では実行不可
2. **音楽再生**: ユーザー操作後のみ可能（ブラウザポリシー）
3. **SVG読み込み**: CORS制限により同一オリジンのみ

### 設計上の制限
1. **ワールドサイズ**: 最大3000x576px
2. **オブジェクト数**: パフォーマンスのため適度に制限
3. **セーブ機能**: 現在未実装

## エラーハンドリング

### エラーの種類
1. **初期化エラー**: 必須要素が見つからない場合
2. **読み込みエラー**: リソースファイルの読み込み失敗
3. **実行時エラー**: ゲームループ中の予期しないエラー

### エラー処理方針
```javascript
// 復旧不可能なエラーは明確に失敗
if (!this.canvas) {
    throw new Error('gameCanvasが見つかりません');
}

// 復旧可能なエラーはデフォルト値を使用
if (!sprite) {
    // フォールバック描画を使用
    this.drawFallback();
}
```

## テスト仕様

### 単体テスト
- **フレームワーク**: 独自の軽量テストランナー
- **カバレッジ**: 主要機能の70%以上
- **実行環境**: ブラウザおよびNode.js（一部）

### 統合テスト
- **自動プレイ**: AIによるゲームプレイシミュレーション
- **状態検証**: ゲーム状態の記録と検証
- **パフォーマンス**: FPS測定とメモリ使用量監視

## 将来の拡張性

### 計画中の機能
- セーブ/ロード機能
- マルチプレイヤー対応
- レベルエディター
- 実績システム

### 拡張ポイント
- **新しい敵タイプ**: ENEMY_CONFIGに追加
- **新しいアイテム**: svg-item-renderer.jsに追加
- **新しいステージ**: levels/ディレクトリに追加