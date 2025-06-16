/**
 * シンプルなヘッドレステスト実行
 * JSDOMとcanvasパッケージを使用して基本的なテストを実行
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { createCanvas } = require('canvas');

class SimpleHeadlessTest {
    constructor() {
        this.dom = null;
        this.window = null;
        this.document = null;
    }
    
    async initialize() {
        try {
            console.log('🚀 ヘッドレステスト環境を初期化中...');
            
            // test.htmlを読み込み
            const htmlPath = path.join(__dirname, '..', 'tests', 'test.html');
            const html = fs.readFileSync(htmlPath, 'utf8');
            
            // JSDOMを設定
            this.dom = new JSDOM(html, {
                url: 'http://localhost:8080/tests/test.html',
                runScripts: 'dangerously',
                resources: 'usable',
                pretendToBeVisual: true,
                beforeParse: (window) => {
                    // Canvas APIを提供
                    window.HTMLCanvasElement.prototype.getContext = function(type) {
                        if (type === '2d') {
                            const canvas = createCanvas(800, 600);
                            return canvas.getContext('2d');
                        }
                        return null;
                    };
                    
                    // requestAnimationFrameのモック
                    let animationFrameId = 0;
                    window.requestAnimationFrame = (callback) => {
                        animationFrameId++;
                        setTimeout(() => callback(Date.now()), 16);
                        return animationFrameId;
                    };
                    
                    // localStorageのモック
                    window.localStorage = {
                        data: {},
                        getItem: function(key) { return this.data[key] || null; },
                        setItem: function(key, value) { this.data[key] = String(value); },
                        removeItem: function(key) { delete this.data[key]; },
                        clear: function() { this.data = {}; }
                    };
                    
                    // AudioContextのモック
                    window.AudioContext = class {
                        constructor() {}
                        createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
                        createGain() { return { connect: () => {}, gain: { value: 0 } }; }
                        get destination() { return {}; }
                    };
                }
            });
            
            this.window = this.dom.window;
            this.document = this.window.document;
            
            console.log('✅ ヘッドレステスト環境初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 初期化エラー:', error.message);
            return false;
        }
    }
    
    async loadScripts() {
        console.log('📜 スクリプトを読み込み中...');
        
        const scripts = [
            'src/config.js',
            'src/levels.js',
            'src/level-loader.js',
            'src/music.js',
            'src/player-graphics.js',
            'src/svg-renderer.js',
            'src/svg-player-renderer.js',
            'src/svg-enemy-renderer.js',
            'src/svg-item-renderer.js',
            'src/game.js',
            'tests/test.js'
        ];
        
        for (const scriptPath of scripts) {
            try {
                const fullPath = path.join(__dirname, '..', scriptPath);
                const scriptContent = fs.readFileSync(fullPath, 'utf8');
                
                // スクリプトを実行
                const scriptElement = this.document.createElement('script');
                scriptElement.textContent = scriptContent;
                this.document.head.appendChild(scriptElement);
                
                console.log(`  ✅ ${scriptPath}`);
            } catch (error) {
                console.log(`  ❌ ${scriptPath}: ${error.message}`);
            }
        }
    }
    
    async waitForTests() {
        console.log('⏳ テスト実行を待機中...');
        
        // テストが完了するまで待機
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Gameクラスの初期化を試行
        if (this.window.Game && !this.window.game) {
            try {
                const canvas = this.document.getElementById('gameCanvas');
                this.window.game = new this.window.Game(canvas);
                console.log('🎮 Gameインスタンスを手動で作成');
            } catch (error) {
                console.log('⚠️ Game初期化エラー（環境制限）:', error.message);
            }
        }
    }
    
    getTestResults() {
        const testResultsElement = this.document.getElementById('testResults');
        if (!testResultsElement) {
            return { error: 'testResults要素が見つかりません' };
        }
        
        // テスト結果を収集
        const passedElements = testResultsElement.querySelectorAll('.test-pass');
        const failedElements = testResultsElement.querySelectorAll('.test-fail');
        
        const passed = passedElements.length;
        const failed = failedElements.length;
        const total = passed + failed;
        
        const failedTests = Array.from(failedElements).map(el => 
            el.textContent.trim().replace(/^✗\s*/, '')
        );
        
        const passedTests = Array.from(passedElements).map(el => 
            el.textContent.trim().replace(/^✓\s*/, '')
        );
        
        return {
            total: total,
            passed: passed,
            failed: failed,
            successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
            failedTests: failedTests,
            passedTests: passedTests,
            hasGameObject: typeof this.window.game !== 'undefined',
            environment: 'jsdom_headless'
        };
    }
    
    cleanup() {
        if (this.dom) {
            this.dom.window.close();
            console.log('🔒 テスト環境をクリーンアップ');
        }
    }
}

async function runSimpleHeadlessTest() {
    const tester = new SimpleHeadlessTest();
    
    try {
        // 初期化
        const initialized = await tester.initialize();
        if (!initialized) {
            throw new Error('テスト環境の初期化に失敗');
        }
        
        // スクリプト読み込み
        await tester.loadScripts();
        
        // テスト実行待機
        await tester.waitForTests();
        
        // 結果取得
        const results = tester.getTestResults();
        
        // 結果表示
        console.log('\n📊 ヘッドレステスト結果:');
        console.log('=====================================');
        console.log(`環境: ${results.environment}`);
        console.log(`ゲームオブジェクト: ${results.hasGameObject ? '✅ 存在' : '❌ 未定義'}`);
        
        if (results.error) {
            console.log(`❌ エラー: ${results.error}`);
        } else {
            console.log(`📈 テスト結果: ${results.passed}/${results.total} 成功`);
            console.log(`📊 成功率: ${results.successRate}%`);
            
            if (results.failedTests.length > 0) {
                console.log('\n❌ 失敗したテスト:');
                results.failedTests.forEach((test, index) => {
                    console.log(`  ${index + 1}. ${test}`);
                });
            }
            
            if (results.passedTests.length > 0) {
                console.log('\n✅ 成功したテスト（一部）:');
                results.passedTests.slice(0, 5).forEach((test, index) => {
                    console.log(`  ${index + 1}. ${test}`);
                });
                if (results.passedTests.length > 5) {
                    console.log(`  ... 他 ${results.passedTests.length - 5} 件`);
                }
            }
        }
        
        console.log('=====================================');
        
        // .test-results.jsonを更新
        const testResultsData = {
            timestamp: new Date().toISOString(),
            method: 'simple_headless_test',
            status: 'completed',
            results: results,
            gameObjectExists: results.hasGameObject,
            environment_notes: 'JSDOM環境での実行。Canvas関連の制限あり'
        };
        
        const testResultsPath = path.join(__dirname, '..', '.test-results.json');
        fs.writeFileSync(testResultsPath, JSON.stringify(testResultsData, null, 2));
        console.log('\n💾 テスト結果を .test-results.json に保存');
        
        return results;
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        return { error: error.message };
        
    } finally {
        tester.cleanup();
    }
}

// 直接実行された場合
if (require.main === module) {
    runSimpleHeadlessTest()
        .then(results => {
            const success = results && !results.error && results.successRate >= 80;
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { runSimpleHeadlessTest };