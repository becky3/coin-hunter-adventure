/**
 * ゲーム設定ファイル（テスト用）
 * ES5形式でグローバル変数として定義
 */

// キャンバス設定
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GRAVITY = 0.8;
const GROUND_Y = CANVAS_HEIGHT - 100;

// プレイヤー設定
const PLAYER_CONFIG = {
    width: 40,
    height: 60,
    speed: 5,
    jumpPower: 18,
    maxHealth: 3,
    invulnerabilityTime: 120,
    spawnX: 100,
    spawnY: 300
};

// 敵キャラクター設定
const ENEMY_CONFIG = {
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
const COIN_CONFIG = {
    width: 30,
    height: 30,
    value: 10,
    rotationSpeed: 0.05
};

// カラーパレット
const COLORS = {
    sky: '#87CEEB',
    ground: '#8B4513',
    platform: '#696969',
    player: '#FF6B6B',
    coin: '#FFD700',
    flag: '#FF0000'
};

console.log('config.js loaded');