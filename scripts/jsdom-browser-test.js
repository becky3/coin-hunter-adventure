/**
 * JSDOM環境でのブラウザテスト実行
 * 実際のHTTPサーバーからtest.htmlを取得してテスト実行
 */

const { JSDOM } = require('jsdom');
const http = require('http');
const fs = require('fs');
const path = require('path');

class JSDOMBrowserTest {
    constructor() {
        this.results = null;
        this.logs = [];
        this.errors = [];
    }
    
    async fetchFromHTTPServer(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('HTTP request timeout'));
            });
        });
    }
    
    async loadScriptContent(scriptSrc) {
        const fullUrl = `http://localhost:8080/${scriptSrc}`;
        try {
            return await this.fetchFromHTTPServer(fullUrl);
        } catch (error) {
            console.warn(`スクリプト読み込み警告: ${scriptSrc} - ${error.message}`);
            return `console.error('スクリプト読み込み失敗: ${scriptSrc}');`;
        }
    }
    
    async runBrowserTest() {
        console.log('🧪 JSDOM環境でのブラウザテスト開始...');
        
        try {
            // 1. test.htmlをHTTPサーバーから取得
            console.log('📄 test.htmlを取得中...');
            const testHtmlContent = await this.fetchFromHTTPServer('http://localhost:8080/tests/test.html');
            
            // 2. JSDOM環境を構築
            console.log('🏗️ JSDOM環境を構築中...');
            const dom = new JSDOM(testHtmlContent, {
                url: 'http://localhost:8080/tests/test.html',
                runScripts: 'dangerously',
                resources: 'usable',
                pretendToBeVisual: true
            });
            
            const { window } = dom;
            
            // グローバル設定（必要最小限）
            if (!global.window) global.window = window;
            if (!global.document) global.document = window.document;
            
            // localStorage mock
            global.localStorage = {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
                clear: () => {}
            };
            
            // fetch mock
            global.fetch = async (url) => {
                if (url.startsWith('levels/')) {
                    const fullUrl = `http://localhost:8080/${url}`;
                    const content = await this.fetchFromHTTPServer(fullUrl);
                    return {
                        ok: true,
                        json: () => Promise.resolve(JSON.parse(content))
                    };
                }
                throw new Error(`Fetch not supported for: ${url}`);
            };
            
            // コンソールログをキャプチャ
            const originalLog = console.log;
            const originalError = console.error;
            
            console.log = (...args) => {
                const message = args.join(' ');
                this.logs.push(message);
                originalLog(...args);
            };
            
            console.error = (...args) => {
                const message = args.join(' ');
                this.errors.push(message);
                originalError(...args);
            };
            
            // 3. スクリプトを順次読み込み・実行
            console.log('📜 スクリプトを読み込み中...');
            const scriptElements = window.document.querySelectorAll('script[src]');
            
            for (const script of scriptElements) {
                const src = script.getAttribute('src');
                if (src && src.startsWith('../')) {
                    const scriptContent = await this.loadScriptContent(src.substring(3));
                    
                    try {
                        // DISABLE_CORS_WARNING フラグを設定
                        if (src.includes('config.js')) {
                            window.DISABLE_CORS_WARNING = true;
                        }
                        
                        const scriptFunction = new Function(scriptContent);
                        scriptFunction.call(window);
                        console.log(`✅ ${src} 読み込み完了`);
                    } catch (error) {
                        console.error(`❌ ${src} 実行エラー:`, error.message);
                        this.errors.push(`Script error in ${src}: ${error.message}`);
                    }
                }
            }
            
            // 4. DOMContentLoadedイベントを発火
            console.log('🔥 DOMContentLoadedイベント発火...');
            window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
            
            // 5. ゲーム初期化を待機
            console.log('⏳ ゲーム初期化を待機中...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 6. テスト結果を取得
            console.log('📊 テスト結果を取得中...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const testResults = this.extractTestResults(window);
            
            // コンソールを復元
            console.log = originalLog;
            console.error = originalError;
            
            return {
                success: true,
                testResults: testResults,
                gameInitialized: !!window.game,
                gameInitError: window.gameInitError ? window.gameInitError.message : null,
                logs: this.logs,
                errors: this.errors
            };
            
        } catch (error) {
            console.error('❌ JSDOM テスト実行エラー:', error.message);
            return {
                success: false,
                error: error.message,
                logs: this.logs,
                errors: this.errors
            };
        }
    }
    
    extractTestResults(window) {
        try {
            const testResultsElement = window.document.getElementById('testResults');
            if (!testResultsElement) {
                return { error: 'testResults要素が見つかりません' };
            }
            
            // 成功/失敗のテスト要素を数える
            const passedElements = testResultsElement.querySelectorAll('.test-pass');
            const failedElements = testResultsElement.querySelectorAll('.test-fail');
            
            const passed = passedElements.length;
            const failed = failedElements.length;
            const total = passed + failed;
            
            const failedTests = Array.from(failedElements).map(el => 
                el.textContent.trim().replace(/^✗\s*/, '')
            );
            
            return {
                total: total,
                passed: passed,
                failed: failed,
                successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
                failedTests: failedTests,
                summary: total > 0 ? `${passed}/${total} tests passed` : 'No tests executed'
            };
            
        } catch (error) {
            return { error: `テスト結果抽出エラー: ${error.message}` };
        }
    }
}

async function runJSJDOMBrowserTest() {
    const tester = new JSDOMBrowserTest();
    const result = await tester.runBrowserTest();
    
    console.log('\n📋 JSDOM ブラウザテスト結果:');
    console.log('=====================================');
    
    if (result.success) {
        console.log(`ゲーム初期化: ${result.gameInitialized ? '✅ 成功' : '❌ 失敗'}`);
        
        if (result.gameInitError) {
            console.log(`初期化エラー: ${result.gameInitError}`);
        }
        
        if (result.testResults.error) {
            console.log(`テスト結果エラー: ${result.testResults.error}`);
        } else {
            console.log(`テスト結果: ${result.testResults.summary}`);
            console.log(`成功率: ${result.testResults.successRate}%`);
            
            if (result.testResults.failedTests.length > 0) {
                console.log('失敗したテスト:');
                result.testResults.failedTests.forEach((test, index) => {
                    console.log(`  ${index + 1}. ${test}`);
                });
            }
        }
        
        if (result.errors.length > 0) {
            console.log('\n❌ エラーログ:');
            result.errors.forEach(error => console.log(`  ${error}`));
        }
        
    } else {
        console.log(`❌ テスト実行失敗: ${result.error}`);
    }
    
    console.log('=====================================');
    
    return result;
}

// 直接実行された場合
if (require.main === module) {
    runJSJDOMBrowserTest()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { JSDOMBrowserTest, runJSJDOMBrowserTest };