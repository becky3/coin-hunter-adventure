/**
 * 改良版ヘッドレステストランナー
 * JSDOM + canvas環境でtest.htmlを実行
 */

const { JSDOM } = require('jsdom');
const http = require('http');
const fs = require('fs');
const path = require('path');

class HeadlessTestRunner {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.testResults = null;
    }
    
    async fetchFromServer(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
    
    async run() {
        console.log('🚀 ヘッドレステストランナー起動...\n');
        
        try {
            // HTTPサーバー確認
            console.log('1️⃣ HTTPサーバー接続確認...');
            await this.fetchFromServer('http://localhost:8080/');
            console.log('✅ HTTPサーバー稼働中\n');
            
            // test.html取得
            console.log('2️⃣ test.htmlを取得中...');
            const html = await this.fetchFromServer('http://localhost:8080/tests/test.html');
            console.log('✅ test.html取得完了\n');
            
            // JSDOM環境構築
            console.log('3️⃣ ブラウザ環境を構築中...');
            const dom = new JSDOM(html, {
                url: 'http://localhost:8080/tests/test.html',
                runScripts: 'dangerously',
                resources: 'usable',
                pretendToBeVisual: true,
                beforeParse(window) {
                    // Canvas対応
                    const canvas = require('canvas');
                    window.HTMLCanvasElement = canvas.Canvas;
                    window.CanvasRenderingContext2D = canvas.CanvasRenderingContext2D;
                    window.Image = canvas.Image;
                    window.ImageData = canvas.ImageData;
                    
                    // localStorage実装
                    const storage = {};
                    window.localStorage = {
                        getItem: (key) => storage[key] || null,
                        setItem: (key, value) => storage[key] = value,
                        removeItem: (key) => delete storage[key],
                        clear: () => Object.keys(storage).forEach(key => delete storage[key])
                    };
                    
                    // fetchをNode.jsのhttpで実装
                    const fetchFromServer = this.fetchFromServer.bind(this);
                    window.fetch = async (url) => {
                        const fullUrl = url.startsWith('http') ? url : `http://localhost:8080/${url}`;
                        try {
                            const content = await fetchFromServer(fullUrl);
                            return {
                                ok: true,
                                text: () => Promise.resolve(content),
                                json: () => Promise.resolve(JSON.parse(content))
                            };
                        } catch (error) {
                            return {
                                ok: false,
                                status: 404,
                                statusText: error.message
                            };
                        }
                    };
                    
                    // ログキャプチャ
                    const originalLog = console.log;
                    const originalError = console.error;
                    
                    const logs = this.logs;
                    const errors = this.errors;
                    
                    window.console.log = (...args) => {
                        const msg = args.join(' ');
                        logs.push(msg);
                        if (msg.includes('テスト') || msg.includes('✓') || msg.includes('✗')) {
                            originalLog(...args);
                        }
                    };
                    
                    window.console.error = (...args) => {
                        const msg = args.join(' ');
                        errors.push(msg);
                        originalError(...args);
                    };
                }
            });
            
            const { window } = dom;
            console.log('✅ ブラウザ環境構築完了\n');
            
            // スクリプト実行待機
            console.log('4️⃣ テスト実行中...');
            console.log('⏳ JavaScriptの実行を待機中...\n');
            
            // DOMContentLoadedイベント発火
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
            
            // テスト完了待機
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 結果取得
            console.log('5️⃣ テスト結果を収集中...');
            this.testResults = this.extractResults(window);
            
            // クリーンアップ
            dom.window.close();
            
            return {
                success: true,
                results: this.testResults,
                gameExists: !!window.game,
                logs: this.logs,
                errors: this.errors
            };
            
        } catch (error) {
            console.error('❌ エラー:', error.message);
            return {
                success: false,
                error: error.message,
                logs: this.logs,
                errors: this.errors
            };
        }
    }
    
    extractResults(window) {
        try {
            const testResultsEl = window.document.getElementById('testResults');
            if (!testResultsEl) {
                return { error: 'テスト結果要素が見つかりません' };
            }
            
            const passedEls = testResultsEl.querySelectorAll('.test-pass');
            const failedEls = testResultsEl.querySelectorAll('.test-fail');
            
            const passed = passedEls.length;
            const failed = failedEls.length;
            const total = passed + failed;
            
            const failedTests = Array.from(failedEls).map(el => 
                el.textContent.trim().replace(/^✗\s*/, '')
            );
            
            const passedTests = Array.from(passedEls).map(el => 
                el.textContent.trim().replace(/^✓\s*/, '')
            );
            
            return {
                total,
                passed,
                failed,
                successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
                failedTests,
                passedTests,
                summary: `${passed}/${total} テスト成功`
            };
            
        } catch (error) {
            return { error: error.message };
        }
    }
    
    displayResults(result) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 テスト実行結果');
        console.log('='.repeat(60) + '\n');
        
        if (result.success) {
            if (result.results.error) {
                console.log(`❌ エラー: ${result.results.error}`);
            } else {
                console.log(`📈 結果: ${result.results.summary}`);
                console.log(`📊 成功率: ${result.results.successRate}%`);
                console.log(`🎮 Gameオブジェクト: ${result.gameExists ? '✅ 存在' : '❌ 未定義'}`);
                
                if (result.results.failedTests.length > 0) {
                    console.log('\n❌ 失敗したテスト:');
                    result.results.failedTests.forEach((test, i) => {
                        console.log(`  ${i + 1}. ${test}`);
                    });
                }
                
                if (result.results.passedTests.length > 0) {
                    console.log('\n✅ 成功したテスト（上位5件）:');
                    result.results.passedTests.slice(0, 5).forEach((test, i) => {
                        console.log(`  ${i + 1}. ${test}`);
                    });
                    if (result.results.passedTests.length > 5) {
                        console.log(`  ... 他 ${result.results.passedTests.length - 5} 件`);
                    }
                }
            }
            
            if (result.errors.length > 0) {
                console.log('\n⚠️ エラーログ（主要なもの）:');
                const mainErrors = result.errors.filter(e => 
                    !e.includes('fetch is not defined') && 
                    !e.includes('canvas') &&
                    !e.includes('Not implemented')
                ).slice(0, 3);
                mainErrors.forEach(error => console.log(`  - ${error}`));
            }
        } else {
            console.log(`❌ 実行失敗: ${result.error}`);
        }
        
        console.log('\n' + '='.repeat(60));
        
        // .test-results.json更新
        const testResultsData = {
            timestamp: new Date().toISOString(),
            method: 'headless_test_runner',
            status: result.success ? 'completed' : 'failed',
            results: result.success ? result.results : { error: result.error },
            gameObjectExists: result.gameExists || false,
            verification_method: 'jsdom_with_canvas'
        };
        
        const testResultsPath = path.join(__dirname, '..', '.test-results.json');
        fs.writeFileSync(testResultsPath, JSON.stringify(testResultsData, null, 2));
        console.log('\n💾 結果を .test-results.json に保存しました');
    }
}

// メイン実行
async function main() {
    const runner = new HeadlessTestRunner();
    const result = await runner.run();
    runner.displayResults(result);
    process.exit(result.success && result.results.failed === 0 ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { HeadlessTestRunner };