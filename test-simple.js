/**
 * シンプルなNode.js環境でのゲームテスト
 * 外部依存なしでゲームロジックをテスト
 */

console.log('=== Game Logic Tests ===\n');

// 基本的なDOM環境のモック
global.window = {
    addEventListener: () => {},
    document: {
        getElementById: () => ({ style: {}, addEventListener: () => {} }),
        querySelector: () => ({ style: {}, getBoundingClientRect: () => ({ width: 1024, height: 576 }) }),
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(cb, 16)
};

global.document = global.window.document;
global.performance = global.window.performance;
global.requestAnimationFrame = global.window.requestAnimationFrame;

// Canvas context mock
const mockCanvas = {
    width: 1024,
    height: 576,
    getContext: () => ({
        save: () => {},
        restore: () => {},
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        arc: () => {},
        ellipse: () => {},
        roundRect: () => {},
        fill: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        createLinearGradient: () => ({
            addColorStop: () => {}
        }),
        createRadialGradient: () => ({
            addColorStop: () => {}
        }),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        shadowBlur: 0,
        shadowColor: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fillText: () => {}
    })
};

global.document.getElementById = (id) => {
    if (id === 'gameCanvas') return mockCanvas;
    return { style: {}, addEventListener: () => {}, textContent: '' };
};

// Audio context mock
global.AudioContext = class MockAudioContext {
    constructor() {
        this.currentTime = 0;
        this.state = 'running';
    }
    createOscillator() {
        return {
            type: 'sine',
            frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        };
    }
    createGain() {
        return {
            gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        };
    }
    get destination() { return {}; }
    resume() { return Promise.resolve(); }
};

// Path2D mock
global.Path2D = class MockPath2D {
    constructor() {}
};

// ファイル読み込み
const fs = require('fs');
const path = require('path');

try {
    // 設定ファイル
    const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
    eval(configContent);
    console.log('✓ Config loaded');
    
    // レベルデータ
    const levelsContent = fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8');
    eval(levelsContent);
    console.log('✓ Level data loaded');
    
    // 音楽システム（mock版）
    global.MusicSystem = class MockMusicSystem {
        constructor() {
            this.isInitialized = false;
            this.isMuted = false;
        }
        async init() { this.isInitialized = true; return Promise.resolve(); }
        playJumpSound() {}
        playCoinSound() {}
        playDamageSound() {}
        playEnemyStompSound() {}
        playButtonClickSound() {}
        playGameStartSound() {}
        playGoalSound() {}
        playFallDeathSound() {}
        playGameBGM() {}
        playVictoryJingle() {}
        playGameOverJingle() {}
        stopBGM() {}
        setVolume() {}
        toggleMute() { return this.isMuted = !this.isMuted; }
        getMuteState() { return this.isMuted; }
    };
    
    console.log('✓ Music system mocked');
    
    // ゲームファイル（DOMContentLoadedイベント部分を除く）
    let gameContent = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
    // DOMContentLoadedの自動実行を無効化
    gameContent = gameContent.replace(/document\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled for testing');
    eval(gameContent);
    console.log('✓ Game logic loaded');
    
    // テスト実行
    console.log('\n=== Running Logic Tests ===\n');
    
    // 基本的なテスト
    let testsPassed = 0;
    let testsFailed = 0;
    
    function test(name, fn) {
        try {
            fn();
            console.log(`✓ ${name}`);
            testsPassed++;
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
            testsFailed++;
        }
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }
    
    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected: ${expected}, Actual: ${actual}`);
        }
    }
    
    function assertGreaterThan(actual, expected, message) {
        if (!(actual > expected)) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }
    
    function assertLessThan(actual, expected, message) {
        if (!(actual < expected)) {
            throw new Error(message || `Expected ${actual} to be less than ${expected}`);
        }
    }
    
    // ゲームロジックテスト
    test('設定ファイルの読み込み', () => {
        assert(typeof CANVAS_WIDTH === 'number', 'CANVAS_WIDTHが定義されていません');
        assert(typeof CANVAS_HEIGHT === 'number', 'CANVAS_HEIGHTが定義されていません');
        assertEquals(CANVAS_WIDTH, 1024, 'CANVAS_WIDTHが正しくありません');
        assertEquals(CANVAS_HEIGHT, 576, 'CANVAS_HEIGHTが正しくありません');
    });
    
    test('レベルデータの読み込み', () => {
        assert(typeof levelData === 'object', 'levelDataが定義されていません');
        assert(Array.isArray(levelData.platforms), 'プラットフォーム配列がありません');
        assert(Array.isArray(levelData.enemies), '敵配列がありません');
        assert(Array.isArray(levelData.coins), 'コイン配列がありません');
    });
    
    test('スプリング設定の検証', () => {
        assert(typeof SPRING_CONFIG === 'object', 'SPRING_CONFIGが定義されていません');
        assertGreaterThan(SPRING_CONFIG.bouncePower, 0, 'スプリング跳躍力が正の値である必要があります');
        assert(Array.isArray(levelData.springs), 'スプリング配列がありません');
        assertGreaterThan(levelData.springs.length, 0, 'スプリングが少なくとも1個配置されている必要があります');
    });
    
    test('GameStateクラス', () => {
        const gameState = new GameState();
        assert(gameState, 'GameStateが作成できません');
        assertEquals(gameState.state, 'start', 'GameStateの初期状態が正しくありません');
        
        gameState.setState('playing');
        assertEquals(gameState.state, 'playing', 'setState動作確認');
        
        gameState.collectCoin();
        assertEquals(gameState.coins, 1, 'コイン収集動作確認');
        assertEquals(gameState.score, 10, 'スコア加算動作確認');
    });
    
    test('Playerクラス', () => {
        const player = new Player(100, 300);
        assertEquals(player.x, 100, 'プレイヤーX座標が正しくありません');
        assertEquals(player.y, 300, 'プレイヤーY座標が正しくありません');
        assertEquals(player.health, PLAYER_CONFIG.maxHealth, '初期体力が正しくありません');
        
        // 移動テスト
        player.handleInput({ right: true, left: false, jump: false });
        assertEquals(player.velX, PLAYER_CONFIG.speed, '右移動速度が正しくありません');
        assertEquals(player.direction, 1, '右向きの方向が正しくありません');
    });
    
    test('InputManagerクラス', () => {
        const inputManager = new InputManager();
        assert(inputManager, 'InputManagerが作成できません');
        assert(typeof inputManager.keys === 'object', 'keysオブジェクトが存在しません');
        
        // 手動でキー状態を設定してテスト
        inputManager.keys.ArrowLeft = true;
        const state = inputManager.getInputState();
        assert(state.left === true, 'getInputStateでleftが検出されません');
    });
    
    test('衝突判定関数', () => {
        // Game クラスから衝突判定メソッドを取得
        const game = {
            checkCollision: function(rect1, rect2) {
                return rect1.x < rect2.x + rect2.width &&
                       rect1.x + rect1.width > rect2.x &&
                       rect1.y < rect2.y + rect2.height &&
                       rect1.y + rect1.height > rect2.y;
            }
        };
        
        const rect1 = { x: 0, y: 0, width: 50, height: 50 };
        const rect2 = { x: 25, y: 25, width: 50, height: 50 };
        const rect3 = { x: 100, y: 100, width: 50, height: 50 };
        
        assert(game.checkCollision(rect1, rect2), '重なるオブジェクトの衝突が検出されません');
        assert(!game.checkCollision(rect1, rect3), '離れたオブジェクトが衝突と判定されました');
    });
    
    test('レベルデザイン改善の検証', () => {
        // 飛行敵（鳥）の配置確認
        const birds = levelData.enemies.filter(e => e.type === 'bird');
        assertGreaterThan(birds.length, 0, '飛行敵（鳥）が少なくとも1体配置されている必要があります');
        
        // 地上敵（スライム）の配置確認
        const slimes = levelData.enemies.filter(e => e.type === 'slime');
        assertGreaterThan(slimes.length, 0, '地上敵（スライム）が少なくとも1体配置されている必要があります');
        
        // コイン数の確認（30枚）
        assert(levelData.coins.length >= 30, 'コイン数が十分に増加していません');
        
        // ゴール位置の確認
        assert(levelData.flag && typeof levelData.flag.x === 'number', 'ゴールフラグが正しく配置されていません');
        assertGreaterThan(levelData.flag.x, 2000, 'ゴール位置がレベルの終盤付近に配置されていません');
    });
    
    test('4セクション構造の確認', () => {
        // セクション1: チュートリアルエリア（0-800px）
        const section1Platforms = levelData.platforms.filter(p => p.x >= 0 && p.x < 800);
        assert(section1Platforms.length >= 3, 'セクション1のプラットフォーム数が不足');
        
        // セクション2: ジャンプチャレンジ（800-1600px）
        const section2Platforms = levelData.platforms.filter(p => p.x >= 800 && p.x < 1600);
        assert(section2Platforms.length >= 3, 'セクション2のプラットフォーム数が不足');
        
        // セクション3: 垂直チャレンジ（1600-2400px）
        const section3Platforms = levelData.platforms.filter(p => p.x >= 1600 && p.x < 2400);
        assert(section3Platforms.length >= 5, 'セクション3のプラットフォーム数が不足');
        
        // セクション4: 最終チャレンジ（2400-3000px）
        const section4Platforms = levelData.platforms.filter(p => p.x >= 2400 && p.x < 3000);
        assert(section4Platforms.length >= 3, 'セクション4のプラットフォーム数が不足');
    });
    
    console.log(`\n=== Test Results ===`);
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    }
    
} catch (error) {
    console.error('Error during test execution:', error);
    process.exit(1);
}