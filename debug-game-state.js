// Debug script to test game initialization without DOM dependencies
const fs = require('fs');

// Mock DOM and window objects
global.document = {
    getElementById: () => null,
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
};
global.window = {
    addEventListener: () => {},
    game: null
};
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };
global.console = console;

// Load game files
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));
eval(fs.readFileSync('music.js', 'utf8'));
eval(fs.readFileSync('game.js', 'utf8'));

console.log('=== ゲーム初期化テスト ===');

try {
    // Mock canvas context
    const mockCanvas = {
        getContext: () => ({
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            fillRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            createLinearGradient: () => ({
                addColorStop: () => {}
            }),
            roundRect: () => {},
            ellipse: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            closePath: () => {}
        }),
        width: 1024,
        height: 576,
        style: {}
    };
    
    // Mock document.getElementById for gameCanvas
    global.document.getElementById = (id) => {
        if (id === 'gameCanvas') return mockCanvas;
        return null;
    };
    
    console.log('GameState作成テスト...');
    const gameState = new GameState();
    console.log('✓ GameState作成成功');
    
    console.log('Player作成テスト...');
    const player = new Player();
    console.log('✓ Player作成成功');
    
    console.log('InputManager作成テスト...');
    const inputManager = new InputManager();
    console.log('✓ InputManager作成成功');
    
    console.log('Game作成テスト...');
    const game = new (class extends Game {
        setupUI() {
            // Skip UI setup for test
        }
        setupCanvas() {
            // Skip canvas setup for test
        }
        setupResizeHandler() {
            // Skip resize handler for test
        }
        start() {
            // Skip game loop start for test
        }
    })();
    console.log('✓ Game作成成功');
    
    console.log('\n=== 敵初期化チェック ===');
    console.log('初期化後の敵数:', game.enemies.length);
    
    const birds = game.enemies.filter(e => e.type === 'bird');
    const slimes = game.enemies.filter(e => e.type === 'slime');
    
    console.log('鳥の数:', birds.length);
    console.log('スライムの数:', slimes.length);
    
    if (birds.length > 0) {
        console.log('\n=== 鳥の詳細 ===');
        birds.forEach((bird, i) => {
            console.log(`鳥${i+1}:`, {
                type: bird.type,
                x: bird.x,
                y: bird.y,
                width: bird.width,
                height: bird.height,
                speed: bird.speed,
                velX: bird.velX,
                direction: bird.direction
            });
        });
    } else {
        console.log('⚠️ 鳥が初期化されていません！');
    }
    
    console.log('\n=== resetLevel後の確認 ===');
    game.resetLevel();
    
    const birdsAfterReset = game.enemies.filter(e => e.type === 'bird');
    console.log('リセット後の鳥の数:', birdsAfterReset.length);
    
} catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('スタック:', error.stack);
}