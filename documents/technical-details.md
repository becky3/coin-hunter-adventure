# 技術詳細ドキュメント

## プロジェクト概要

**プロジェクト名**: コインハンター アドベンチャー  
**種類**: 2Dプラットフォームゲーム  
**技術スタック**: HTML5, CSS3, JavaScript (Vanilla)  
**音響**: Web Audio API  
**開発**: AI支援開発（Claude Code）

## アーキテクチャ

### ファイル構成
```
coin-hunter-adventure/
├── index.html          # メインHTMLファイル
├── game.js            # ゲームロジック（984行）
├── style.css          # スタイルシート
├── README.md          # プロジェクト説明
└── documents/         # プロジェクト記録
    ├── development-log.md
    ├── conversation-summary.md
    └── technical-details.md
```

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTML5 Canvas  │    │   Web Audio API │    │  JavaScript ES6 │
│   (描画エンジン)  │◄──►│   (音響システム)  │◄──►│  (ゲームロジック) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CSS3 Styling  │    │   Event System  │    │   Game State    │
│   (UI/UXデザイン) │    │  (キー入力処理)   │    │   (状態管理)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## コア技術詳細

### 1. ゲームエンジン設計

#### 状態管理システム
```javascript
// ゲーム状態の定義
gameState = 'start' | 'playing' | 'gameOver' | 'levelComplete'

// 状態遷移
start → playing → (gameOver | levelComplete) → start
```

#### 物理エンジン
```javascript
// 重力システム
const GRAVITY = 0.8;
player.velY += GRAVITY; // 毎フレーム重力を適用

// 衝突判定（AABB）
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

#### カメラシステム
```javascript
// プレイヤー追従カメラ
function updateCamera() {
    const targetX = player.x - CANVAS_WIDTH / 2;
    camera.x = Math.max(0, Math.min(targetX, WORLD_WIDTH - CANVAS_WIDTH));
}
```

### 2. 音響システム（Web Audio API）

#### BGM生成アルゴリズム
```javascript
/**
 * 3層音響構成
 * - Melody: メインメロディ（サイン波 + 倍音）
 * - Bass: 低音部（サイン波 + サブベース）
 * - Harmony: 和音（サイン波）
 */

// 音響データ生成
for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // メロディレイヤー
    if (melodyFreq > 0) {
        sample += Math.sin(2 * Math.PI * melodyFreq * t) * 0.25;
        sample += Math.sin(2 * Math.PI * melodyFreq * 1.5 * t) * 0.08;
    }
    
    // ベースレイヤー
    if (bassFreq > 0) {
        sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.15;
        sample += Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.05;
    }
    
    // ハーモニーレイヤー
    if (harmonyFreq > 0) {
        sample += Math.sin(2 * Math.PI * harmonyFreq * t) * 0.12;
    }
    
    // エンベロープ適用
    const envelope = Math.sin(Math.PI * noteProgress) * 0.8 + 0.2;
    sample *= envelope;
    
    // リバーブ効果
    if (i >= reverbDelay) {
        sample += data[i - reverbDelay] * 0.15;
    }
    
    data[i] = sample * 0.4; // マスターボリューム
}
```

#### 効果音システム
```javascript
// 効果音定義
const soundEffects = {
    jump: [
        {freq: 220, duration: 0.1, type: 'square'},
        {freq: 330, duration: 0.1, type: 'square'}
    ],
    coin: [
        {freq: 523, duration: 0.1, type: 'sine'},
        {freq: 659, duration: 0.1, type: 'sine'},
        {freq: 784, duration: 0.2, type: 'sine'}
    ]
    // ...他の効果音
};
```

### 3. 入力システム

#### キー管理システム
```javascript
// キー状態管理
const keys = {}; // 現在押されているキーの状態

// 複数キー対応
function updatePlayer() {
    // 左移動（矢印キーまたはA）
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -player.speed;
    }
    // 右移動（矢印キーまたはD）
    else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = player.speed;
    }
    // ジャンプ（スペースまたはW）
    if ((keys['Space'] || keys['KeyW']) && player.onGround) {
        player.velY = -player.jumpPower;
    }
}
```

### 4. 描画システム

#### Canvas描画最適化
```javascript
// 描画順序の最適化
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBackground();    // 背景（最背面）
    drawPlatforms();     // プラットフォーム
    drawCoins();         // コイン
    drawEnemies();       // 敵
    drawPlayer();        // プレイヤー（最前面）
    drawFlag();          // ゴールフラッグ
}

// ビューポート最適化（画面外オブジェクトの描画スキップ）
if (x + object.width > 0 && x < CANVAS_WIDTH) {
    // 画面内にある場合のみ描画
}
```

#### アニメーションシステム
```javascript
// フレームベースアニメーション
player.animTimer++;
if (player.animTimer > 8) {
    player.animFrame = (player.animFrame + 1) % 4;
    player.animTimer = 0;
}

// 無敵時の点滅効果
if (player.invulnerable && Math.floor(player.invulnerabilityTime / 5) % 2) {
    ctx.globalAlpha = 0.5; // 半透明化
}
```

## パフォーマンス最適化

### 1. 描画最適化
- **ビューポートカリング**: 画面外オブジェクトの描画スキップ
- **レイヤー描画**: 描画順序の最適化
- **Canvas最適化**: clearRect()の効率的な使用

### 2. 音響最適化
- **バッファ再利用**: 音響バッファーの事前生成
- **ループ最適化**: BGMのシームレスループ
- **メモリ管理**: 不要な音響データの解放

### 3. ゲームロジック最適化
- **衝突判定の最適化**: 必要な場合のみ詳細判定
- **状態管理**: 不要な計算の削減
- **イベント処理**: 効率的なキー入力処理

## セキュリティ考慮事項

### 1. 入力検証
- キーイベントの適切な処理
- デフォルト動作の防止（スクロール等）
- XSS対策（innerHTML使用回避）

### 2. リソース管理
- メモリリークの防止
- Audio Contextの適切な管理
- イベントリスナーの適切な登録/解除

## 拡張性設計

### 1. モジュール化
```javascript
// 音響システムの分離
const AudioSystem = {
    init: initAudio,
    createBGM: createBGM,
    playSound: (soundName) => sounds[soundName]?.play()
};

// ゲーム状態の分離
const GameState = {
    current: 'start',
    transition: (newState) => { /* 状態遷移ロジック */ }
};
```

### 2. 設定システム
```javascript
// ゲーム設定の外部化
const CONFIG = {
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 576,
    GRAVITY: 0.8,
    PLAYER_SPEED: 5,
    JUMP_POWER: 18
};
```

### 3. レベルデータ化
```javascript
// レベルデータの構造化
const LEVELS = {
    1: {
        platforms: [ /* プラットフォームデータ */ ],
        enemies: [ /* 敵データ */ ],
        coins: [ /* コインデータ */ ],
        bgm: 'adventure1'
    }
};
```

## 開発ツールチェーン

### 1. バージョン管理
```bash
# Git設定
git config user.name "Game Developer"
git config user.email "developer@coinkhunter.game"

# コミット規約
git commit -m "feat: 新機能の追加
- 具体的な変更内容
- ユーザーからの要求内容
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. GitHub連携
```bash
# API経由でのリポジトリ作成
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     -X POST https://api.github.com/user/repos \
     -d '{"name":"coin-hunter-adventure","description":"..."}'
```

### 3. ドキュメント生成
- JSDoc形式のコメント
- Markdown形式のドキュメント
- 自動生成可能な構造

## 品質保証

### 1. コード品質
- **JSDoc**: 全関数の詳細ドキュメント
- **命名規約**: 分かりやすい変数・関数名
- **コメント**: 日本語での詳細説明

### 2. 機能テスト
- ブラウザ互換性テスト
- キー操作テスト
- 音響システムテスト
- 状態遷移テスト

### 3. パフォーマンステスト
- フレームレートの監視
- メモリ使用量の確認
- 描画パフォーマンスの測定

## 今後の技術拡張

### 1. フレームワーク導入
- **PixiJS**: 高性能2D描画
- **Howler.js**: 高度な音響制御
- **Matter.js**: 本格的物理エンジン

### 2. 開発環境改善
- **Webpack**: モジュールバンドル
- **Babel**: ES6+トランスパイル
- **ESLint**: コード品質チェック

### 3. 配信・公開
- **GitHub Pages**: 無料ホスティング
- **PWA化**: オフライン対応
- **モバイル最適化**: タッチ操作対応

---

**文書作成日**: 2025-06-09  
**技術レベル**: 中級〜上級  
**対象読者**: 開発者、技術者、プロジェクト関係者