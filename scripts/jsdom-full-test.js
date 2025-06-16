/**
 * JSDOMを使用した完全なブラウザ環境シミュレーション
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

class FullGameTest {
    constructor() {
        this.errors = [];
        this.logs = [];
    }
    
    async createBrowserEnvironment() {
        // 実際のindex.htmlを読み込み
        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
        
        this.dom = new JSDOM(indexHtml, {
            url: 'http://localhost:8080/',
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true,
            beforeParse: (window) => {
                // fetch APIを提供
                window.fetch = async (url) => {
                    const filePath = path.join(__dirname, '..', url);
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        return {
                            ok: true,
                            status: 200,
                            json: () => Promise.resolve(JSON.parse(content)),
                            text: () => Promise.resolve(content)
                        };
                    } catch (error) {
                        return {
                            ok: false,
                            status: 404,
                            statusText: 'Not Found'
                        };
                    }
                };
                
                // localStorage
                window.localStorage = {
                    data: {},
                    getItem: function(key) { return this.data[key] || null; },
                    setItem: function(key, value) { this.data[key] = String(value); },
                    removeItem: function(key) { delete this.data[key]; },
                    clear: function() { this.data = {}; }
                };
                
                // Canvas
                const { createCanvas } = require('canvas');
                window.HTMLCanvasElement.prototype.getContext = function(type) {
                    if (type === '2d') {
                        const canvas = createCanvas(this.width || 1024, this.height || 576);
                        return canvas.getContext('2d');
                    }
                    return null;
                };
                
                // AudioContext
                window.AudioContext = class {
                    constructor() {}
                    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
                    createGain() { return { connect: () => {}, gain: { value: 0 } }; }
                    get destination() { return {}; }
                };
                
                // requestAnimationFrame
                let rafId = 0;
                window.requestAnimationFrame = (callback) => {
                    rafId++;
                    setTimeout(() => callback(Date.now()), 16);
                    return rafId;
                };
                
                // エラーハンドリング
                window.addEventListener('error', (event) => {
                    this.errors.push({
                        type: 'error',
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        error: event.error
                    });
                });
                
                window.addEventListener('unhandledrejection', (event) => {
                    this.errors.push({
                        type: 'promise',
                        reason: event.reason
                    });
                });
                
                // console.log/error をキャプチャ
                const originalConsole = {
                    log: console.log,
                    error: console.error,
                    warn: console.warn
                };
                
                window.console.log = (...args) => {
                    this.logs.push({type: 'log', message: args.join(' ')});
                    originalConsole.log(...args);
                };
                
                window.console.error = (...args) => {
                    this.logs.push({type: 'error', message: args.join(' ')});
                    this.errors.push({type: 'console', message: args.join(' ')});
                    originalConsole.error(...args);
                };
                
                window.console.warn = (...args) => {
                    this.logs.push({type: 'warn', message: args.join(' ')});
                    originalConsole.warn(...args);
                };
            }
        });
        
        this.window = this.dom.window;
        this.document = this.window.document;
    }
    
    async loadScripts() {
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
            'src/game.js'
        ];
        
        for (const scriptPath of scripts) {
            try {
                const scriptContent = fs.readFileSync(path.join(__dirname, '..', scriptPath), 'utf8');
                const scriptElement = this.document.createElement('script');
                scriptElement.textContent = scriptContent;
                this.document.head.appendChild(scriptElement);
                
                console.log(`✅ ${scriptPath} 読み込み完了`);
            } catch (error) {
                console.error(`❌ ${scriptPath} 読み込み失敗:`, error.message);
                this.errors.push({type: 'script-load', file: scriptPath, error: error.message});
            }
        }
    }
    
    async waitForInitialization() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒
            
            const check = () => {
                attempts++;
                
                if (this.window.game && this.window.game.isInitialized) {
                    resolve({success: true, game: this.window.game});
                } else if (this.window.gameInitError) {
                    resolve({success: false, error: this.window.gameInitError});
                } else if (attempts >= maxAttempts) {
                    resolve({success: false, error: new Error('初期化タイムアウト')});
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    async runFullTest() {
        try {
            console.log('🚀 完全ブラウザ環境テスト開始');
            
            await this.createBrowserEnvironment();
            console.log('✅ ブラウザ環境作成完了');
            
            await this.loadScripts();
            console.log('✅ スクリプト読み込み完了');
            
            // DOMContentLoaded イベントを発火
            const event = new this.window.Event('DOMContentLoaded');
            this.document.dispatchEvent(event);
            console.log('✅ DOMContentLoaded イベント発火');
            
            // 初期化完了を待機
            const result = await this.waitForInitialization();
            
            console.log('\n📊 テスト結果:');
            console.log('=====================================');
            console.log(`初期化成功: ${result.success}`);
            
            if (result.success) {
                console.log('✅ ゲーム初期化成功');
                console.log(`ゲームオブジェクト存在: ${!!this.window.game}`);
                console.log(`初期化完了フラグ: ${this.window.game?.isInitialized}`);
            } else {
                console.log('❌ ゲーム初期化失敗');
                console.log(`エラー: ${result.error?.message}`);
                if (result.error?.stack) {
                    console.log(`スタック: ${result.error.stack}`);
                }
            }
            
            if (this.errors.length > 0) {
                console.log('\n🚨 検出されたエラー:');
                this.errors.forEach((error, index) => {
                    console.log(`${index + 1}. [${error.type}] ${error.message || error.reason}`);
                    if (error.filename) {
                        console.log(`   at ${error.filename}:${error.lineno}:${error.colno}`);
                    }
                });
            }
            
            console.log('\n📝 重要なログ:');
            this.logs.slice(-10).forEach((log, index) => {
                console.log(`${index + 1}. [${log.type}] ${log.message}`);
            });
            
            return {
                success: result.success,
                errors: this.errors,
                logs: this.logs,
                gameExists: !!this.window.game,
                gameInitialized: this.window.game?.isInitialized || false
            };
            
        } catch (error) {
            console.error('❌ テスト実行エラー:', error);
            return {
                success: false,
                errors: [{ type: 'test', message: error.message, stack: error.stack }],
                logs: this.logs
            };
        } finally {
            if (this.dom) {
                this.dom.window.close();
            }
        }
    }
}

// 実行
if (require.main === module) {
    const test = new FullGameTest();
    test.runFullTest().then(result => {
        console.log('\n🏁 テスト完了');
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { FullGameTest };