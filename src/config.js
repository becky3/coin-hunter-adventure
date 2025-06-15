/**
 * ゲーム設定ファイル（テスト用）
 * ES5形式でグローバル変数として定義
 */

// キャンバス設定
var CANVAS_WIDTH = 1024;
var CANVAS_HEIGHT = 576;
var GRAVITY = 0.65;  // 0.8 -> 0.65 に減少（ジャンプの高さを維持）
var GROUND_Y = CANVAS_HEIGHT - 100;

// グローバルゲームスピード設定（0.1 〜 2.0）
var GAME_SPEED = 0.7; // 全体的な速度を70%に減速

// プレイヤー設定
var PLAYER_CONFIG = {
    width: 40,
    height: 60,
    speed: 3.5,      // 5 -> 3.5 に減速（30%減）
    jumpPower: 18,   // 15 -> 18 に増加（より高いジャンプ）
    minJumpPower: 8,  // 可変ジャンプの最小値（12 -> 8 に減少）
    jumpDecayRate: 0.65, // ボタンを離した時の上昇速度減衰率（0.85 -> 0.65 でより急激に減速）
    maxJumpTime: 20,  // 可変ジャンプの最大持続フレーム数
    maxHealth: 2,
    invulnerabilityTime: 120,
    spawnX: 100,
    spawnY: 300
};

// 敵キャラクター設定
var ENEMY_CONFIG = {
    slime: {
        width: 50,
        height: 40,
        speed: 0.7,  // 1 -> 0.7 に減速（30%減）
        color: '#4CAF50'
    },
    bird: {
        width: 40,
        height: 30,
        speed: 1.4,  // 2 -> 1.4 に減速（30%減）
        amplitude: 50,
        color: '#9C27B0'
    }
};

// コイン設定
var COIN_CONFIG = {
    width: 30,
    height: 30,
    value: 10,
    rotationSpeed: 0.035  // 0.05 -> 0.035 に減速（30%減）
};

// スプリング設定
var SPRING_CONFIG = {
    width: 40,
    height: 40,
    bouncePower: 25,
    animationSpeed: 0.14  // 0.2 -> 0.14 に減速（30%減）
};

// カラーパレット
var COLORS = {
    sky: '#87CEEB',
    ground: '#8B4513',
    platform: '#696969',
    player: '#FF6B6B',
    coin: '#FFD700',
    flag: '#FF0000'
};

if (typeof console !== 'undefined') {
    console.log('config.js loaded');
}