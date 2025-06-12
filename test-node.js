/**
 * Node.js環境でのゲームテスト
 * DOM環境をシミュレートしてゲームロジックをテスト
 */

// JSDOMで DOM環境をセットアップ
const { JSDOM } = require('jsdom');
const { createCanvas } = require('canvas');

// DOM環境を設定
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
    <canvas id="gameCanvas" width="1024" height="576"></canvas>
    <div id="testResults"></div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.performance = { now: () => Date.now() };

// Canvas polyfill
const canvas = createCanvas(1024, 576);
const ctx = canvas.getContext('2d');
document.getElementById('gameCanvas').getContext = () => ctx;

// Web Audio API mock
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

// ゲームファイルを読み込み
const fs = require('fs');
const path = require('path');

try {
    // 設定ファイル
    const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
    eval(configContent);
    
    // レベルデータ
    const levelsContent = fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8');
    eval(levelsContent);
    
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
    
    // ゲームファイル
    const gameContent = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
    eval(gameContent);
    
    // テストファイル
    const testContent = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8');
    eval(testContent);
    
    console.log('✓ All game files loaded successfully');
    console.log('✓ DOM environment initialized');
    console.log('✓ Canvas context mocked');
    console.log('✓ Audio context mocked');
    
    // テストを実行
    console.log('\n=== Starting Tests ===\n');
    
    // DOMContentLoaded イベントをシミュレート
    const event = new dom.window.Event('DOMContentLoaded');
    dom.window.document.dispatchEvent(event);
    
    // テストランナーを直接実行
    setTimeout(() => {
        if (typeof runner !== 'undefined') {
            runner.run().then(() => {
                console.log('\n=== Test Execution Complete ===');
                process.exit(runner.failed > 0 ? 1 : 0);
            }).catch((error) => {
                console.error('Test execution failed:', error);
                process.exit(1);
            });
        } else {
            console.error('Test runner not found');
            process.exit(1);
        }
    }, 100);
    
} catch (error) {
    console.error('Error loading game files:', error);
    process.exit(1);
}