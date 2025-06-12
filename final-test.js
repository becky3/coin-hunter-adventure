/**
 * 最終テスト - test.htmlと同等の検証を実行
 * シンプルで確実な方法
 */

console.log('=== Final Test Execution ===\n');

const fs = require('fs');
const path = require('path');

// DOM環境のモック
global.window = {
    addEventListener: () => {},
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(cb, 16)
};

global.document = {
    getElementById: (id) => {
        if (id === 'gameCanvas') {
            return {
                width: 1024, height: 576,
                getContext: () => ({
                    save: () => {}, restore: () => {}, clearRect: () => {},
                    fillRect: () => {}, strokeRect: () => {}, beginPath: () => {},
                    closePath: () => {}, moveTo: () => {}, lineTo: () => {},
                    quadraticCurveTo: () => {}, arc: () => {}, ellipse: () => {},
                    roundRect: () => {}, fill: () => {}, stroke: () => {},
                    translate: () => {}, scale: () => {}, rotate: () => {},
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    fillStyle: '', strokeStyle: '', lineWidth: 1,
                    globalAlpha: 1, shadowBlur: 0, shadowColor: '',
                    font: '', textAlign: '', textBaseline: '', fillText: () => {}
                })
            };
        }
        return { style: {}, addEventListener: () => {}, textContent: '', innerHTML: '' };
    },
    querySelector: () => ({ style: { display: 'flex' }, getBoundingClientRect: () => ({ width: 1024, height: 576 }) }),
    querySelectorAll: () => [{ addEventListener: () => {} }],
    addEventListener: () => {}
};

global.performance = global.window.performance;
global.requestAnimationFrame = global.window.requestAnimationFrame;

// Audio/Path2D mock
global.AudioContext = class { 
    constructor() { this.currentTime = 0; this.state = 'running'; }
    createOscillator() { return { type: 'sine', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    get destination() { return {}; }
    resume() { return Promise.resolve(); }
};
global.Path2D = class { constructor() {} };

// テスト結果
let testResults = {
    passed: 0,
    failed: 0,
    results: []
};

function test(name, fn) {
    try {
        fn();
        testResults.passed++;
        testResults.results.push({ name, passed: true, error: null });
        console.log(`✓ ${name}`);
    } catch (error) {
        testResults.failed++;
        testResults.results.push({ name, passed: false, error: error.message });
        console.log(`✗ ${name}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) throw new Error(message || `Expected: ${expected}, Actual: ${actual}`);
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) throw new Error(message || `${actual} は ${expected} より大きくありません`);
}

async function runFinalTest() {
    try {
        console.log('Loading all game files...');
        
        // 1. Config
        eval(fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8'));
        console.log('✓ config.js loaded');
        
        // 2. Levels 
        eval(fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8'));
        console.log('✓ levels.js loaded');
        
        // 3. Music
        eval(fs.readFileSync(path.join(__dirname, 'music.js'), 'utf8'));
        console.log('✓ music.js loaded');
        
        // 4. Game (DOMContentLoaded除外)
        let gameContent = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
        gameContent = gameContent.replace(/document\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled');
        eval(gameContent);
        console.log('✓ game.js loaded');
        
        console.log('\n=== Running Tests (Same as test.html) ===\n');
        
        // test.htmlと同じテストを実行
        test('設定ファイルの読み込み', () => {
            assert(typeof CANVAS_WIDTH === 'number', 'CANVAS_WIDTHが定義されていません');
            assert(typeof CANVAS_HEIGHT === 'number', 'CANVAS_HEIGHTが定義されていません');
            assertEquals(CANVAS_WIDTH, 1024, 'CANVAS_WIDTHが正しくありません');
            assertEquals(CANVAS_HEIGHT, 576, 'CANVAS_HEIGHTが正しくありません');
            
            assert(typeof PLAYER_CONFIG === 'object', 'PLAYER_CONFIGが定義されていません');
            assertEquals(PLAYER_CONFIG.speed, 5, 'プレイヤー速度が正しくありません');
            assertEquals(PLAYER_CONFIG.jumpPower, 18, 'ジャンプ力が正しくありません');
        });

        test('レベルデータの読み込み', () => {
            assert(typeof levelData === 'object', 'levelDataが定義されていません');
            assert(Array.isArray(levelData.platforms), 'プラットフォーム配列がありません');
            assert(Array.isArray(levelData.enemies), '敵配列がありません');
            assert(Array.isArray(levelData.coins), 'コイン配列がありません');
            assert(levelData.flag && typeof levelData.flag === 'object', 'フラグオブジェクトがありません');
            
            assertGreaterThan(levelData.platforms.length, 0, 'プラットフォームが存在しません');
            assertGreaterThan(levelData.enemies.length, 0, '敵が存在しません');
            assertGreaterThan(levelData.coins.length, 0, 'コインが存在しません');
        });

        test('ゲームクラスの初期化', () => {
            const gameState = new GameState();
            assert(gameState, 'GameStateが作成できません');
            assertEquals(gameState.state, 'start', 'GameStateの初期状態が正しくありません');
            
            const inputManager = new InputManager();
            assert(inputManager, 'InputManagerが作成できません');
            assert(typeof inputManager.keys === 'object', 'InputManagerのkeysオブジェクトがありません');
            
            const player = new Player();
            assert(player, 'Playerが作成できません');
        });

        test('プレイヤーの生成と初期状態', () => {
            const player = new Player(100, 300);
            assertEquals(player.x, 100, 'プレイヤーX座標が正しくありません');
            assertEquals(player.y, 300, 'プレイヤーY座標が正しくありません');
            assertEquals(player.width, PLAYER_CONFIG.width, 'プレイヤー幅が正しくありません');
            assertEquals(player.height, PLAYER_CONFIG.height, 'プレイヤー高さが正しくありません');
            assertEquals(player.velX, 0, '初期X速度が0ではありません');
            assertEquals(player.velY, 0, '初期Y速度が0ではありません');
            assertEquals(player.health, PLAYER_CONFIG.maxHealth, '初期体力が正しくありません');
            assert(!player.isJumping, 'プレイヤーが初期状態でジャンプ中です');
        });

        test('入力マネージャーの動作', () => {
            const inputManager = new InputManager();
            assert(typeof inputManager.keys === 'object', 'keysオブジェクトが存在しません');
            
            inputManager.keys.ArrowLeft = true;
            inputManager.keys.ArrowRight = false;
            inputManager.keys.Space = true;
            
            const state = inputManager.getInputState();
            assert(state.left === true, 'getInputStateでleftが検出されません');
            assert(!state.right, 'getInputStateでrightが誤検出されています');
            assert(state.jump === true, 'getInputStateでjumpが検出されません');
        });

        test('スプリング設定の読み込み', () => {
            assert(typeof SPRING_CONFIG === 'object', 'SPRING_CONFIGが定義されていません');
            assertEquals(SPRING_CONFIG.width, 40, 'スプリング幅が正しくありません');
            assertEquals(SPRING_CONFIG.height, 40, 'スプリング高さが正しくありません');
            assertEquals(SPRING_CONFIG.bouncePower, 25, 'スプリング跳躍力が正しくありません');
            assertEquals(SPRING_CONFIG.animationSpeed, 0.2, 'スプリングアニメーション速度が正しくありません');
        });

        test('改善されたレベルデータの検証', () => {
            assert(Array.isArray(levelData.springs), 'スプリング配列がありません');
            assertEquals(levelData.springs.length, 3, 'スプリングが3個配置されていません');
            
            const expectedSpringPositions = [
                { x: 650, y: 456 },
                { x: 1750, y: 456 },
                { x: 2000, y: 80 }
            ];
            
            expectedSpringPositions.forEach((expected, index) => {
                assert(levelData.springs[index], `スプリング${index + 1}が存在しません`);
                assertEquals(levelData.springs[index].x, expected.x, `スプリング${index + 1}のX座標が正しくありません`);
                assertEquals(levelData.springs[index].y, expected.y, `スプリング${index + 1}のY座標が正しくありません`);
            });
            
            const birds = levelData.enemies.filter(e => e.type === 'bird');
            assertEquals(birds.length, 6, '飛行敵（鳥）が6体配置されていません');
            
            const slimes = levelData.enemies.filter(e => e.type === 'slime');
            assertEquals(slimes.length, 7, '地上敵（スライム）が7体配置されていません');
            
            assert(levelData.coins.length >= 30, 'コイン数が十分に増加していません');
            assertEquals(levelData.flag.x, 2900, 'ゴール位置が正しくありません');
        });

        test('4セクション構造の確認', () => {
            const section1Platforms = levelData.platforms.filter(p => p.x >= 0 && p.x < 800);
            assertGreaterThan(section1Platforms.length, 3, 'セクション1のプラットフォーム数が不足');
            
            const section2Platforms = levelData.platforms.filter(p => p.x >= 800 && p.x < 1600);
            assertGreaterThan(section2Platforms.length, 3, 'セクション2のプラットフォーム数が不足');
            
            const section3Platforms = levelData.platforms.filter(p => p.x >= 1600 && p.x < 2400);
            assertGreaterThan(section3Platforms.length, 5, 'セクション3のプラットフォーム数が不足');
            
            const section4Platforms = levelData.platforms.filter(p => p.x >= 2400 && p.x < 3000);
            assertGreaterThan(section4Platforms.length, 3, 'セクション4のプラットフォーム数が不足');
        });

        console.log('\n=== Test Results ===');
        console.log(`✓ Passed: ${testResults.passed}`);
        console.log(`✗ Failed: ${testResults.failed}`);
        console.log(`Total: ${testResults.passed + testResults.failed}`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All tests passed! test.html would work correctly.');
            return true;
        } else {
            console.log('\n❌ Some tests failed. test.html has issues.');
            return false;
        }
        
    } catch (error) {
        console.error('Fatal error during test execution:', error);
        return false;
    }
}

runFinalTest().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});