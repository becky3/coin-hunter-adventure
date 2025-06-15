// ブラウザ環境をエミュレート
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><canvas id="gameCanvas"></canvas>');
global.window = dom.window;
global.document = dom.window.document;
global.Image = dom.window.Image;
global.performance = { now: () => Date.now() };

// CORS警告を無効化
global.window.DISABLE_CORS_WARNING = true;

// ファイルを順番に読み込み
const fs = require('fs');

console.log('Loading game files...');

// evalで実行（グローバル変数として定義されるように）
eval(fs.readFileSync('./src/config.js', 'utf8'));
eval(fs.readFileSync('./src/levels.js', 'utf8'));
eval(fs.readFileSync('./src/music.js', 'utf8'));
eval(fs.readFileSync('./src/player-graphics.js', 'utf8'));
eval(fs.readFileSync('./src/svg-player-renderer.js', 'utf8'));
eval(fs.readFileSync('./src/svg-enemy-renderer.js', 'utf8'));
eval(fs.readFileSync('./src/svg-item-renderer.js', 'utf8'));
eval(fs.readFileSync('./src/game.js', 'utf8'));

console.log('\n--- Test Results ---');
console.log('PLAYER_CONFIG.jumpPower:', PLAYER_CONFIG.jumpPower);

// Gameインスタンスを作成してPlayerを取得
try {
    const game = new Game();
    const player = game.player;
    
    console.log('player.jumpPower:', player.jumpPower);
    
    // ジャンプテスト
    player.onGround = true;
    player.isJumping = false;
    const velYBefore = player.velY;
    
    player.handleInput({ right: false, left: false, jump: true });
    
    console.log('velY before jump:', velYBefore);
    console.log('velY after jump:', player.velY);
    console.log('Expected velY:', -PLAYER_CONFIG.jumpPower);
    console.log('Test passed:', player.velY === -PLAYER_CONFIG.jumpPower);
    
} catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
}