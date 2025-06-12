/**
 * ブラウザ環境をシミュレートしてtest.htmlと同じテストを実行
 */

console.log('=== Browser Test Simulation ===\n');

// より完全なDOM環境のモック
global.window = {
    addEventListener: () => {},
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    game: null
};

global.document = {
    getElementById: (id) => {
        const elements = {
            'gameCanvas': {
                width: 1024,
                height: 576,
                style: {},
                getContext: () => ({
                    save: () => {}, restore: () => {}, clearRect: () => {}, fillRect: () => {},
                    strokeRect: () => {}, beginPath: () => {}, closePath: () => {},
                    moveTo: () => {}, lineTo: () => {}, quadraticCurveTo: () => {},
                    arc: () => {}, ellipse: () => {}, roundRect: () => {},
                    fill: () => {}, stroke: () => {}, translate: () => {},
                    scale: () => {}, rotate: () => {},
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    createRadialGradient: () => ({ addColorStop: () => {} }),
                    fillStyle: '', strokeStyle: '', lineWidth: 1,
                    globalAlpha: 1, shadowBlur: 0, shadowColor: '',
                    font: '', textAlign: '', textBaseline: '', fillText: () => {}
                })
            },
            'testResults': { innerHTML: '' },
            'startBtn': { addEventListener: () => {} },
            'restartBtn1': { addEventListener: () => {} },
            'restartBtn2': { addEventListener: () => {} },
            'backToTitleBtn1': { addEventListener: () => {} },
            'backToTitleBtn2': { addEventListener: () => {} },
            'volumeSlider': { addEventListener: () => {} },
            'muteBtn': { addEventListener: () => {}, textContent: '', classList: { toggle: () => {} } },
            'score': { textContent: '' },
            'lives': { textContent: '' },
            'coins': { textContent: '' },
            'finalScore': { textContent: '' },
            'clearScore': { textContent: '' }
        };
        return elements[id] || { style: {}, addEventListener: () => {}, textContent: '' };
    },
    querySelector: (selector) => ({
        style: { display: 'flex' },
        getBoundingClientRect: () => ({ width: 1024, height: 576 })
    }),
    querySelectorAll: () => [{ addEventListener: () => {} }],
    addEventListener: () => {},
    createElement: () => ({ appendChild: () => {} }),
    head: { appendChild: () => {} }
};

global.performance = global.window.performance;
global.requestAnimationFrame = global.window.requestAnimationFrame;

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
            connect: () => {}, start: () => {}, stop: () => {}
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
global.Path2D = class MockPath2D { constructor() {} };

// Event mock
global.Event = class MockEvent {
    constructor(type) { this.type = type; }
};

const fs = require('fs');
const path = require('path');

async function runBrowserSimulation() {
    try {
        console.log('Loading game files...');
        
        // ファイルを順次読み込み
        const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
        eval(configContent);
        console.log('✓ Config loaded');
        
        const levelsContent = fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8');
        eval(levelsContent);
        console.log('✓ Levels loaded');
        
        const musicContent = fs.readFileSync(path.join(__dirname, 'music.js'), 'utf8');
        eval(musicContent);
        console.log('✓ Music system loaded');
        
        // game.jsを読み込み（DOMContentLoadedを除外）
        let gameContent = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
        gameContent = gameContent.replace(/document\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled');
        eval(gameContent);
        console.log('✓ Game logic loaded');
        
        // test.jsを読み込み（DOMContentLoadedを除外）
        let testContent = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8');
        testContent = testContent.replace(/window\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled');
        // const runner を global.runner に変更し、全ての runner 参照も global.runner に変更
        testContent = testContent.replace(/const runner = new TestRunner\(\);/, 'global.runner = new TestRunner();');
        testContent = testContent.replace(/runner\./g, 'global.runner.');
        eval(testContent);
        console.log('✓ Test framework loaded');
        
        console.log('\n=== Starting Test Execution ===\n');
        
        // runnerがグローバルスコープにあるか確認
        console.log('Checking for runner:', typeof runner, typeof global.runner, typeof window.runner);
        
        // テストランナーが利用可能か確認
        const runner = global.runner;
        if (!runner) {
            console.log('Test content preview:', testContent.substring(testContent.indexOf('global.runner'), testContent.indexOf('global.runner') + 200));
            throw new Error('Test runner not found');
        }
        
        // テストを実行
        await runner.run();
        
        console.log('\n=== Browser Simulation Complete ===');
        
        if (runner.failed === 0) {
            console.log('🎉 All browser tests would pass!');
            process.exit(0);
        } else {
            console.log(`❌ ${runner.failed} tests would fail in browser`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Browser simulation error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

runBrowserSimulation();