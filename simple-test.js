// シンプルなテスト
const fs = require('fs');

// グローバル変数の設定
global.window = global;
global.document = {
    getElementById: () => null,
    createElement: () => ({ getContext: () => null }),
    addEventListener: () => {}
};
global.Image = function() {};
global.performance = { now: Date.now };

// config.jsだけ読み込む
console.log('Loading config.js...');
eval(fs.readFileSync('./src/config.js', 'utf8'));

console.log('\nPLAYER_CONFIG values:');
console.log('jumpPower:', PLAYER_CONFIG.jumpPower);
console.log('minJumpPower:', PLAYER_CONFIG.minJumpPower);
console.log('jumpDecayRate:', PLAYER_CONFIG.jumpDecayRate);
console.log('maxJumpTime:', PLAYER_CONFIG.maxJumpTime);

// Playerクラスだけ抽出してテスト
console.log('\nExtracting Player class...');
const gameContent = fs.readFileSync('./src/game.js', 'utf8');

// Playerクラスの開始位置を見つける
const playerStart = gameContent.indexOf('class Player {');
if (playerStart === -1) {
    console.error('Player class not found!');
    process.exit(1);
}

// 対応する閉じ括弧を見つける
let braceCount = 0;
let inClass = false;
let playerEnd = playerStart;

for (let i = playerStart; i < gameContent.length; i++) {
    if (gameContent[i] === '{') {
        braceCount++;
        inClass = true;
    } else if (gameContent[i] === '}') {
        braceCount--;
        if (inClass && braceCount === 0) {
            playerEnd = i + 1;
            break;
        }
    }
}

const playerClassCode = gameContent.substring(playerStart, playerEnd);
console.log('Player class extracted, length:', playerClassCode.length);
console.log('First 100 chars:', playerClassCode.substring(0, 100));

// windowオブジェクトの依存を解決
global.window = global.window || { game: null };

// Playerクラスを評価
try {
    // グローバルに直接代入
    const func = new Function('PLAYER_CONFIG', 'GRAVITY', 'window', playerClassCode + '\nreturn Player;');
    global.Player = func(PLAYER_CONFIG, GRAVITY, window);
    console.log('Player class evaluated successfully');
    console.log('typeof Player:', typeof Player);
} catch (e) {
    console.error('Error evaluating Player class:', e.message);
    console.error('Stack:', e.stack);
}

console.log('\nTesting Player jump...');
const player = new Player(100, 100);
console.log('player.jumpPower:', player.jumpPower);

// ジャンプテスト
player.onGround = true;
player.isJumping = false;
console.log('Before jump - velY:', player.velY);

player.handleInput({ right: false, left: false, jump: true });

console.log('After jump - velY:', player.velY);
console.log('Expected velY:', -PLAYER_CONFIG.jumpPower);
console.log('Jump test passed:', player.velY === -PLAYER_CONFIG.jumpPower);