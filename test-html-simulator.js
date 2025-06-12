/**
 * test.htmlと全く同じ順序でスクリプトを読み込み、実際のエラーを特定
 */

console.log('=== test.html Simulator ===\n');

// より完全なブラウザ環境をシミュレート
global.window = {
    addEventListener: function(event, callback) {
        if (event === 'DOMContentLoaded') {
            // DOMContentLoadedを即座に発火
            setTimeout(callback, 100);
        }
    },
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    game: null
};

global.document = {
    getElementById: function(id) {
        const mockElements = {
            'gameCanvas': {
                width: 1024,
                height: 576,
                style: {},
                getContext: () => ({
                    save: () => {}, restore: () => {}, clearRect: () => {},
                    fillRect: () => {}, strokeRect: () => {}, beginPath: () => {},
                    closePath: () => {}, moveTo: () => {}, lineTo: () => {},
                    quadraticCurveTo: () => {}, arc: () => {}, ellipse: () => {},
                    roundRect: () => {}, fill: () => {}, stroke: () => {},
                    translate: () => {}, scale: () => {}, rotate: () => {},
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    createRadialGradient: () => ({ addColorStop: () => {} }),
                    fillStyle: '', strokeStyle: '', lineWidth: 1,
                    globalAlpha: 1, shadowBlur: 0, shadowColor: '',
                    font: '', textAlign: '', textBaseline: '', fillText: () => {}
                })
            },
            'testResults': { 
                innerHTML: '',
                set innerHTML(value) {
                    console.log('TEST RESULTS UPDATE:', value);
                }
            }
        };
        return mockElements[id] || { 
            style: {}, 
            addEventListener: () => {}, 
            textContent: '',
            innerHTML: '',
            classList: { toggle: () => {} }
        };
    },
    querySelector: (selector) => ({
        style: { display: 'flex' },
        getBoundingClientRect: () => ({ width: 1024, height: 576 })
    }),
    querySelectorAll: () => [{ addEventListener: () => {} }],
    addEventListener: function(event, callback) {
        if (event === 'DOMContentLoaded') {
            setTimeout(callback, 200);
        }
    }
};

global.performance = global.window.performance;
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.AudioContext = class MockAudioContext {
    constructor() { this.currentTime = 0; this.state = 'running'; }
    createOscillator() { return { type: 'sine', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    get destination() { return {}; }
    resume() { return Promise.resolve(); }
};
global.Path2D = class MockPath2D { constructor() {} };

const fs = require('fs');

async function simulateTestHtml() {
    try {
        console.log('Simulating test.html script loading order...\n');
        
        // 1. config.js
        console.log('1. Loading config.js...');
        try {
            const configContent = fs.readFileSync('config.js', 'utf8');
            eval(configContent);
            console.log('   ✓ config.js loaded successfully');
            console.log('   ✓ CANVAS_WIDTH:', typeof CANVAS_WIDTH !== 'undefined' ? CANVAS_WIDTH : 'UNDEFINED');
        } catch (error) {
            console.log('   ✗ config.js failed:', error.message);
            return;
        }
        
        // 2. levels.js
        console.log('\n2. Loading levels.js...');
        try {
            const levelsContent = fs.readFileSync('levels.js', 'utf8');
            eval(levelsContent);
            console.log('   ✓ levels.js loaded successfully');
            console.log('   ✓ levelData:', typeof levelData !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
        } catch (error) {
            console.log('   ✗ levels.js failed:', error.message);
            return;
        }
        
        // 3. music.js
        console.log('\n3. Loading music.js...');
        try {
            const musicContent = fs.readFileSync('music.js', 'utf8');
            eval(musicContent);
            console.log('   ✓ music.js loaded successfully');
            console.log('   ✓ MusicSystem:', typeof MusicSystem !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
        } catch (error) {
            console.log('   ✗ music.js failed:', error.message);
            return;
        }
        
        // 4. game.js
        console.log('\n4. Loading game.js...');
        try {
            const gameContent = fs.readFileSync('game.js', 'utf8');
            eval(gameContent);
            console.log('   ✓ game.js loaded successfully');
            console.log('   ✓ Game class:', typeof Game !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            console.log('   ✓ Player class:', typeof Player !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            console.log('   ✓ GameState class:', typeof GameState !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
        } catch (error) {
            console.log('   ✗ game.js failed:', error.message);
            console.error('   Error details:', error.stack);
            return;
        }
        
        // 5. test.js
        console.log('\n5. Loading test.js...');
        try {
            const testContent = fs.readFileSync('test.js', 'utf8');
            eval(testContent);
            console.log('   ✓ test.js loaded successfully');
            console.log('   ✓ TestRunner class:', typeof TestRunner !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            console.log('   ✓ runner instance:', typeof runner !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            
            // アサーション関数の確認
            console.log('   ✓ assert function:', typeof assert !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            console.log('   ✓ assertEquals function:', typeof assertEquals !== 'undefined' ? 'DEFINED' : 'UNDEFINED');
            
        } catch (error) {
            console.log('   ✗ test.js failed:', error.message);
            console.error('   Error details:', error.stack);
            return;
        }
        
        console.log('\n=== All scripts loaded successfully ===');
        console.log('Waiting for DOMContentLoaded simulation...\n');
        
        // DOMContentLoadedイベントを待つ（シミュレート）
        await new Promise(resolve => {
            setTimeout(() => {
                console.log('DOMContentLoaded event fired!');
                
                // test.jsのDOMContentLoadedハンドラーが実行されるはず
                console.log('Checking runner availability:', typeof runner);
                
                if (typeof runner !== 'undefined') {
                    console.log('✓ Runner is available, starting tests...');
                    
                    // テスト実行をシミュレート
                    runner.run().then(() => {
                        console.log('\n🎉 Test simulation completed successfully!');
                        resolve();
                    }).catch(error => {
                        console.log('\n❌ Test execution failed:', error.message);
                        resolve();
                    });
                } else {
                    console.log('✗ Runner is not available');
                    resolve();
                }
            }, 600); // test.jsの遅延と同じ
        });
        
    } catch (error) {
        console.error('Fatal error in simulation:', error);
    }
}

simulateTestHtml();