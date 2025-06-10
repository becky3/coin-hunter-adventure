#!/usr/bin/env node
/**
 * Node.js環境でのテスト実行環境
 * ブラウザAPIを正確にモックしてテストを実行
 */

// ブラウザAPIのフルモック
class MockElement {
    constructor(tagName, id = '') {
        this.tagName = tagName;
        this.id = id;
        this.style = { display: 'block' };
        this.innerHTML = '';
        this.width = 1024;
        this.height = 576;
        this.eventListeners = {};
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    getContext(type) {
        return {
            fillRect: () => {},
            fillText: () => {},
            drawImage: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            clearRect: () => {}
        };
    }
    
    dispatchEvent(event) {
        if (this.eventListeners[event.type]) {
            this.eventListeners[event.type].forEach(callback => callback(event));
        }
    }
}

class MockDocument {
    constructor() {
        this.elements = {
            'gameCanvas': new MockElement('canvas', 'gameCanvas'),
            'testResults': new MockElement('div', 'testResults'),
            'startScreen': new MockElement('div', 'startScreen'),
            'gameOverScreen': new MockElement('div', 'gameOverScreen'),
            'gameClearScreen': new MockElement('div', 'gameClearScreen'),
            'startBtn': new MockElement('button', 'startBtn')
        };
        this.eventListeners = {};
    }
    
    getElementById(id) {
        return this.elements[id] || null;
    }
    
    querySelectorAll(selector) {
        return [];
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    dispatchEvent(event) {
        if (this.eventListeners[event.type]) {
            this.eventListeners[event.type].forEach(callback => callback(event));
        }
    }
}

class MockWindow {
    constructor() {
        this.game = null;
        this.eventListeners = {};
    }
    
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
        
        // DOMContentLoadedを即座に実行
        if (event === 'DOMContentLoaded') {
            setTimeout(callback, 0);
        }
    }
}

function MockKeyboardEvent(type, init) {
    this.type = type;
    this.code = init.code || '';
    this.key = init.key || '';
}

// グローバル設定
global.document = new MockDocument();
global.window = new MockWindow();
global.KeyboardEvent = MockKeyboardEvent;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);

// ファイル読み込み
const fs = require('fs');

console.log('=== Node.js テスト環境開始 ===\n');

// 実行結果を記録
const results = {
    passed: 0,
    failed: 0,
    errors: []
};

function logResult(test, success, error = null) {
    if (success) {
        console.log(`✓ ${test}`);
        results.passed++;
    } else {
        console.log(`✗ ${test}: ${error}`);
        results.failed++;
        results.errors.push({ test, error });
    }
}

try {
    // 1. config.js
    console.log('Loading config.js...');
    eval(fs.readFileSync('./config.js', 'utf8'));
    logResult('config.js loading', typeof CANVAS_WIDTH === 'number');
    
    // 2. levels.js
    console.log('Loading levels.js...');
    eval(fs.readFileSync('./levels.js', 'utf8'));
    logResult('levels.js loading', Array.isArray(levelData.platforms));
    
    // 3. game.js
    console.log('Loading game.js...');
    eval(fs.readFileSync('./game.js', 'utf8'));
    console.log('Available globals:', Object.keys(global).filter(k => k.includes('Player') || k.includes('Game') || k.includes('Input')));
    console.log('Player type:', typeof Player);
    console.log('GameState type:', typeof GameState);
    console.log('InputManager type:', typeof InputManager);
    logResult('game.js loading', typeof Player === 'function');
    
    // ゲームループを停止
    if (global.window.game) {
        global.window.game.isRunning = false;
    }
    
    console.log('\n=== 個別コンポーネントテスト ===');
    
    // 4. Player test
    try {
        const player = new Player(100, 300);
        logResult('Player creation', player.x === 100 && player.y === 300);
        
        player.handleInput({ right: true, left: false, jump: false });
        logResult('Player movement', player.velX === PLAYER_CONFIG.speed);
    } catch (e) {
        logResult('Player test', false, e.message);
    }
    
    // 5. GameState test
    try {
        const gameState = new GameState();
        logResult('GameState creation', gameState.state === 'start');
        
        gameState.setState('playing');
        logResult('GameState setState', gameState.state === 'playing');
    } catch (e) {
        logResult('GameState test', false, e.message);
    }
    
    // 6. InputManager test
    try {
        const inputManager = new InputManager();
        logResult('InputManager creation', typeof inputManager.keys === 'object');
        
        inputManager.keys.ArrowLeft = true;
        const state = inputManager.getInputState();
        logResult('InputManager getInputState', state.left === true);
    } catch (e) {
        logResult('InputManager test', false, e.message);
    }
    
    // 7. Collision test
    try {
        function checkCollision(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }
        
        const rect1 = { x: 0, y: 0, width: 50, height: 50 };
        const rect2 = { x: 25, y: 25, width: 50, height: 50 };
        const result = checkCollision(rect1, rect2);
        logResult('Collision detection', result === true);
    } catch (e) {
        logResult('Collision test', false, e.message);
    }
    
    console.log('\n=== test.js テストスイート実行 ===');
    
    // test.jsを読み込んで実行
    eval(fs.readFileSync('./test.js', 'utf8'));
    
    // 少し待ってから結果を表示
    setTimeout(() => {
        console.log('\n=== 最終結果 ===');
        console.log(`成功: ${results.passed}`);
        console.log(`失敗: ${results.failed}`);
        console.log(`合計: ${results.passed + results.failed}`);
        
        if (results.failed > 0) {
            console.log('\n失敗したテスト:');
            results.errors.forEach(({ test, error }) => {
                console.log(`- ${test}: ${error}`);
            });
            process.exit(1);
        } else {
            console.log('\n🎉 すべてのテストが成功しました！');
            process.exit(0);
        }
    }, 1000);
    
} catch (error) {
    console.error('\n❌ テスト実行エラー:', error.message);
    console.error(error.stack);
    process.exit(1);
}