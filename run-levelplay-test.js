#!/usr/bin/env node

/**
 * レベルテストプレイ実行スクリプト
 * Node.js環境でレベルの自動テストプレイを実行
 */

const fs = require('fs');

// グローバル変数をモック
global.CANVAS_WIDTH = 1024;
global.CANVAS_HEIGHT = 576;
global.GRAVITY = 0.8;
global.performance = {
    now: () => Date.now()
};

// ゲームファイルを読み込み
console.log('ゲームファイルを読み込み中...');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

// 必要なクラスをモック
global.GameState = class GameState {
    constructor() {
        this.state = 'start';
        this.score = 0;
        this.lives = 3;
    }
    
    setState(newState) {
        this.state = newState;
    }
};

global.Player = class Player {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_CONFIG.width;
        this.height = PLAYER_CONFIG.height;
        this.velX = 0;
        this.velY = 0;
        this.speed = PLAYER_CONFIG.speed;
        this.jumpPower = PLAYER_CONFIG.jumpPower;
        this.health = PLAYER_CONFIG.maxHealth;
        this.onGround = false;
        this.isJumping = false;
        this.direction = 1;
        this.invulnerable = false;
    }
    
    handleInput(input) {
        // 左右移動
        if (input.left) {
            this.velX = -this.speed;
            this.direction = -1;
        } else if (input.right) {
            this.velX = this.speed;
            this.direction = 1;
        } else {
            this.velX = 0;
        }
        
        // ジャンプ
        if (input.jump && this.onGround && !this.isJumping) {
            this.velY = -this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
        }
    }
    
    update() {
        // 速度制限
        this.velX = Math.max(-10, Math.min(10, this.velX));
        this.velY = Math.max(-25, Math.min(20, this.velY));
    }
};

// テストプレイモジュールを読み込み
eval(fs.readFileSync('test-levelplay.js', 'utf8'));

// メイン実行
async function main() {
    console.log('=== レベルテストプレイシステム ===');
    console.log('');
    
    const testplay = new LevelTestplay();
    
    // コマンドライン引数でレベル名を指定可能
    const levelName = process.argv[2] || 'default';
    
    // テスト実行
    await testplay.runTest(levelName);
    
    // 結果サマリー
    setTimeout(() => {
        console.log('\n=== 全体サマリー ===');
        testplay.results.forEach((result, index) => {
            console.log(`\nテスト ${index + 1}:`);
            console.log(`  結果: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`  時間: ${result.time.toFixed(1)}秒`);
            if (result.success) {
                console.log(`  効率: ${(result.coinsCollected / result.totalCoins * 100).toFixed(1)}%`);
            } else {
                console.log(`  進行度: ${result.progress}%`);
            }
        });
        
        // レポートファイルに保存
        const report = {
            timestamp: new Date().toISOString(),
            levelName: levelName,
            results: testplay.results
        };
        
        const reportPath = `testplay-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nレポートを保存しました: ${reportPath}`);
        
        process.exit(0);
    }, 2000);
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
});

// 実行
main().catch(error => {
    console.error('実行エラー:', error);
    process.exit(1);
});