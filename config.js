/**
 * ゲーム設定ファイル（テスト用）
 * ES5形式でグローバル変数として定義
 */

// キャンバス設定
var CANVAS_WIDTH = 1024;
var CANVAS_HEIGHT = 576;
var GRAVITY = 0.8;
var GROUND_Y = CANVAS_HEIGHT - 100;

// プレイヤー設定
var PLAYER_CONFIG = {
    width: 40,
    height: 60,
    speed: 5,
    jumpPower: 18,
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
        speed: 1,
        color: '#4CAF50'
    },
    bird: {
        width: 40,
        height: 30,
        speed: 2,
        amplitude: 50,
        color: '#9C27B0'
    }
};

// コイン設定
var COIN_CONFIG = {
    width: 30,
    height: 30,
    value: 10,
    rotationSpeed: 0.05
};

// スプリング設定
var SPRING_CONFIG = {
    width: 40,
    height: 40,
    bouncePower: 25,
    animationSpeed: 0.2
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