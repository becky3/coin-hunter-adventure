---
layout: default
title: 技術仕様
---

# ⚙️ 技術仕様

[← トップに戻る](index)

## システムアーキテクチャ

### 全体構成図

<table style="width: 100%; text-align: center; border-collapse: collapse;">
  <tr>
    <td style="border: 2px solid #333; padding: 20px; background-color: #f0f0f0;">
      <strong>HTML5 Canvas</strong><br>
      (描画エンジン)
    </td>
    <td style="padding: 10px;">↔</td>
    <td style="border: 2px solid #333; padding: 20px; background-color: #f0f0f0;">
      <strong>Web Audio API</strong><br>
      (音響システム)
    </td>
    <td style="padding: 10px;">↔</td>
    <td style="border: 2px solid #333; padding: 20px; background-color: #f0f0f0;">
      <strong>JavaScript ES6</strong><br>
      (ゲームロジック)
    </td>
  </tr>
  <tr>
    <td style="padding: 10px;">↕</td>
    <td></td>
    <td style="padding: 10px;">↕</td>
    <td></td>
    <td style="padding: 10px;">↕</td>
  </tr>
  <tr>
    <td style="border: 2px solid #333; padding: 20px; background-color: #e8e8e8;">
      <strong>CSS3 Styling</strong><br>
      (UI/UXデザイン)
    </td>
    <td></td>
    <td style="border: 2px solid #333; padding: 20px; background-color: #e8e8e8;">
      <strong>Event System</strong><br>
      (キー入力処理)
    </td>
    <td></td>
    <td style="border: 2px solid #333; padding: 20px; background-color: #e8e8e8;">
      <strong>Game State</strong><br>
      (状態管理)
    </td>
  </tr>
</table>

### 技術スタック

| 層 | 技術 | 用途 |
|------|------|------|
| **Frontend** | HTML5, CSS3 | UI/UX、レイアウト |
| **Graphics** | Canvas 2D API | ゲーム描画 |
| **Audio** | Web Audio API | BGM・効果音 |
| **Logic** | JavaScript (ES6+) | ゲームロジック |
| **Build** | Vanilla | ライブラリ不使用 |

---

## 🎵 音響システム

### BGM生成アルゴリズム
**3層音響構成**:
```javascript
// メインループでの音響生成
for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // メロディレイヤー（基音 + 倍音）
    if (melodyFreq > 0) {
        sample += Math.sin(2 * Math.PI * melodyFreq * t) * 0.25;
        sample += Math.sin(2 * Math.PI * melodyFreq * 1.5 * t) * 0.08;
    }
    
    // ベースレイヤー（低音 + サブベース）
    if (bassFreq > 0) {
        sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.15;
        sample += Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.05;
    }
    
    // ハーモニーレイヤー
    if (harmonyFreq > 0) {
        sample += Math.sin(2 * Math.PI * harmonyFreq * t) * 0.12;
    }
    
    // エンベロープ適用（自然な音響）
    const envelope = Math.sin(Math.PI * noteProgress) * 0.8 + 0.2;
    sample *= envelope;
    
    // リバーブ効果
    if (i >= reverbDelay) {
        sample += data[i - reverbDelay] * 0.15;
    }
    
    data[i] = sample * 0.4; // マスターボリューム
}
```

### 音響特徴

| 要素 | 仕様 | 効果 |
|------|------|------|
| **サンプルレート** | 44.1kHz | CD品質 |
| **ビット深度** | 32bit Float | 高精度 |
| **レイヤー数** | 3層構成 | 豊かな音響 |
| **エフェクト** | リバーブ | 空間表現 |

---

## 🎮 ゲームエンジン

### 物理演算システム
**重力システム**:
```javascript
const GRAVITY = 0.8;        // 重力定数
player.velY += GRAVITY;     // 毎フレーム重力適用
```

**衝突判定（AABB）**:
```javascript
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

### 状態管理
**ゲーム状態遷移**:
```javascript
// 状態定義
gameState = 'start' | 'playing' | 'gameOver' | 'levelComplete'

// 状態遷移フロー
start → playing → (gameOver | levelComplete) → start
```

### カメラシステム
**プレイヤー追従**:
```javascript
function updateCamera() {
    const targetX = player.x - CANVAS_WIDTH / 2;
    camera.x = Math.max(0, Math.min(targetX, WORLD_WIDTH - CANVAS_WIDTH));
}
```

---

## 🖼️ 描画システム

### 描画最適化
**ビューポートカリング**:
```javascript
// 画面内チェック
if (x + object.width > 0 && x < CANVAS_WIDTH) {
    // 画面内にある場合のみ描画
    drawObject(object);
}
```

**レイヤー別描画順序**:
1. 背景（最背面）
2. プラットフォーム
3. コイン
4. 敵キャラクター
5. プレイヤー（最前面）
6. UI要素

### アニメーションシステム
**フレームベースアニメーション**:
```javascript
// アニメーション更新
player.animTimer++;
if (player.animTimer > 8) {
    player.animFrame = (player.animFrame + 1) % 4;
    player.animTimer = 0;
}

// 無敵時の点滅効果
if (player.invulnerable && Math.floor(player.invulnerabilityTime / 5) % 2) {
    ctx.globalAlpha = 0.5;
}
```

---

## 🎯 入力システム

### マルチキー対応
**キー状態管理**:
```javascript
const keys = {}; // キー状態を保持

// 複数キー同時サポート
function updatePlayer() {
    // 左移動（矢印キーまたはA）
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -player.speed;
        player.direction = -1;
    }
    // 右移動（矢印キーまたはD）
    else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = player.speed;
        player.direction = 1;
    }
    // ジャンプ（スペースまたはW）
    if ((keys['Space'] || keys['KeyW']) && player.onGround) {
        player.velY = -player.jumpPower;
        player.onGround = false;
    }
}
```

### 入力仕様

| キー | 機能 | 代替キー |
|------|------|----------|
| `←` | 左移動 | `A` |
| `→` | 右移動 | `D` |
| `Space` | ジャンプ | `W` |

---

## 📊 パフォーマンス仕様

### 描画性能

| 項目 | 目標値 | 実績値 |
|------|--------|--------|
| **フレームレート** | 60 FPS | 60 FPS ✅ |
| **描画オブジェクト** | 画面内のみ | 最適化済み ✅ |
| **メモリ使用量** | < 50MB | 効率的 ✅ |

### 音響性能

| 項目 | 仕様 | 効果 |
|------|------|------|
| **レイテンシ** | < 10ms | 即座の応答 |
| **CPU使用** | < 5% | 軽量処理 |
| **バッファ** | 事前生成 | スムーズ再生 |

### ゲームロジック

| 項目 | 最適化 | 効果 |
|------|--------|------|
| **衝突判定** | 必要時のみ | CPU効率 |
| **状態更新** | 差分のみ | メモリ効率 |
| **イベント処理** | 非同期 | UI応答性 |

---

## 🔧 開発環境

### ファイル構成
```
coin-hunter-adventure/
├── index.html              # ゲーム本体
├── game.js                # ゲームロジック（984行）
├── style.css              # スタイルシート
├── README.md              # プロジェクト説明
├── documents/             # 開発ドキュメント
│   ├── development-log.md
│   ├── conversation-summary.md
│   ├── technical-details.md
│   └── wiki-setup-guide.md
└── docs/                  # GitHub Pages
    ├── index.md
    ├── development-log.md
    ├── technical-specifications.md
    └── _config.yml
```

### 品質保証

| 項目 | 実装状況 |
|------|----------|
| **JSDoc** | 全関数対応 ✅ |
| **コメント** | 日本語詳細 ✅ |
| **命名規約** | 統一済み ✅ |
| **型安全性** | 適切な検証 ✅ |

---

## 🚀 拡張性設計

### モジュール化
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

### 設定外部化
```javascript
// ゲーム設定の構造化
const CONFIG = {
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 576,
    GRAVITY: 0.8,
    PLAYER_SPEED: 5,
    JUMP_POWER: 18
};
```

### レベルデータ化
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

---

## 🔐 セキュリティ

### 入力検証
- キーイベントの適切な処理
- XSS対策（innerHTML使用回避）
- デフォルト動作の防止

### リソース管理
- メモリリークの防止
- Audio Contextの適切な管理
- イベントリスナーの登録/解除

---

## 📈 今後の技術拡張

### フレームワーク導入候補

| ライブラリ | 用途 | 効果 |
|-----------|------|------|
| **PixiJS** | 高性能2D描画 | WebGL対応 |
| **Howler.js** | 高度な音響制御 | クロスブラウザ |
| **Matter.js** | 本格的物理エンジン | リアルな物理 |

### 開発環境改善

| ツール | 用途 | 効果 |
|--------|------|------|
| **Webpack** | モジュールバンドル | 効率的なビルド |
| **Babel** | ES6+トランスパイル | ブラウザ互換性 |
| **ESLint** | コード品質チェック | 品質向上 |

---

[← トップに戻る](index) | [対話記録 →](conversation-history)