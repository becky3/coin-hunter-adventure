/**
 * Playwrightを使用した実際のブラウザでのテスト実行
 * Puppeteerの代替としてPlaywrightを試用
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class PlaywrightTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    
    async initialize() {
        try {
            console.log('🚀 Playwrightブラウザを起動中...');
            this.browser = await chromium.launch({
                headless: true
            });
            this.page = await this.browser.newPage();
            
            // コンソールログをキャプチャ
            this.page.on('console', msg => {
                const type = msg.type();
                const text = msg.text();
                if (type === 'error') {
                    console.log(`❌ Browser Error: ${text}`);
                } else if (type === 'log' && text.includes('Test')) {
                    console.log(`📝 Browser Log: ${text}`);
                }
            });
            
            // JavaScript エラーをキャプチャ
            this.page.on('pageerror', error => {
                console.log(`💥 Page Error: ${error.message}`);
            });
            
            console.log('✅ Playwrightブラウザ起動完了');
            return true;
        } catch (error) {
            console.error('❌ Playwrightブラウザ起動失敗:', error.message);
            return false;
        }
    }
    
    async runTests() {
        try {
            console.log('🔍 テストページを読み込み中...');
            
            // テストページにアクセス
            await this.page.goto('http://localhost:8080/tests/test.html', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            console.log('✅ テストページ読み込み完了');
            
            // JavaScriptが実行されるまで待機
            console.log('⏳ テスト実行を待機中...');
            await this.page.waitForTimeout(5000);
            
            // window.gameが存在するかチェック
            const gameExists = await this.page.evaluate(() => {
                return typeof window.game !== 'undefined';
            });
            
            console.log(`🎮 window.game存在確認: ${gameExists ? '✅ 存在' : '❌ 未定義'}`);
            
            // テスト結果を取得
            const testResults = await this.page.evaluate(() => {
                const testResultsElement = document.getElementById('testResults');
                if (!testResultsElement) {
                    return { error: 'testResults要素が見つかりません' };
                }
                
                // 成功・失敗のテスト要素を取得
                const passedElements = testResultsElement.querySelectorAll('.test-pass');
                const failedElements = testResultsElement.querySelectorAll('.test-fail');
                
                const passed = passedElements.length;
                const failed = failedElements.length;
                const total = passed + failed;
                
                // 失敗したテストの詳細を取得
                const failedTests = Array.from(failedElements).map(el => {
                    return el.textContent.trim().replace(/^✗\s*/, '');
                });
                
                // 成功したテストの詳細も取得
                const passedTests = Array.from(passedElements).map(el => {
                    return el.textContent.trim().replace(/^✓\s*/, '');
                });
                
                return {
                    total: total,
                    passed: passed,
                    failed: failed,
                    successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
                    failedTests: failedTests,
                    passedTests: passedTests,
                    hasGameObject: typeof window.game !== 'undefined'
                };
            });
            
            // スクリーンショットを撮影
            const screenshotPath = path.join(__dirname, '..', 'test-screenshot-playwright.png');
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 スクリーンショット保存: ${screenshotPath}`);
            
            return {
                success: true,
                gameExists: gameExists,
                testResults: testResults,
                screenshotPath: screenshotPath
            };
            
        } catch (error) {
            console.error('❌ テスト実行エラー:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Playwrightブラウザを終了');
        }
    }
}

async function runPlaywrightTest() {
    const runner = new PlaywrightTestRunner();
    
    try {
        // 初期化
        const initialized = await runner.initialize();
        if (!initialized) {
            return { success: false, error: 'Playwright初期化失敗' };
        }
        
        // テスト実行
        const result = await runner.runTests();
        
        // 結果表示
        console.log('\n📊 Playwrightテスト結果:');
        console.log('=====================================');
        
        if (result.success) {
            console.log(`ゲームオブジェクト: ${result.gameExists ? '✅ 存在' : '❌ 未定義'}`);
            
            if (result.testResults.error) {
                console.log(`❌ テスト結果エラー: ${result.testResults.error}`);
            } else {
                console.log(`📈 テスト結果: ${result.testResults.passed}/${result.testResults.total} 成功`);
                console.log(`📊 成功率: ${result.testResults.successRate}%`);
                
                if (result.testResults.failedTests.length > 0) {
                    console.log('\n❌ 失敗したテスト:');
                    result.testResults.failedTests.forEach((test, index) => {
                        console.log(`  ${index + 1}. ${test}`);
                    });
                }
                
                if (result.testResults.passedTests.length > 0) {
                    console.log('\n✅ 成功したテスト:');
                    result.testResults.passedTests.slice(0, 5).forEach((test, index) => {
                        console.log(`  ${index + 1}. ${test}`);
                    });
                    if (result.testResults.passedTests.length > 5) {
                        console.log(`  ... 他 ${result.testResults.passedTests.length - 5} 件`);
                    }
                }
            }
            
            console.log(`\n📸 スクリーンショット: ${result.screenshotPath}`);
        } else {
            console.log(`❌ テスト実行失敗: ${result.error}`);
        }
        
        console.log('=====================================');
        
        // .test-results.jsonを更新
        const testResultsData = {
            timestamp: new Date().toISOString(),
            method: 'playwright_browser_test',
            status: result.success ? 'completed' : 'failed',
            results: result.success ? result.testResults : { error: result.error },
            gameObjectExists: result.gameExists || false,
            verification_method: 'automated_browser_execution'
        };
        
        const testResultsPath = path.join(__dirname, '..', '.test-results.json');
        fs.writeFileSync(testResultsPath, JSON.stringify(testResultsData, null, 2));
        console.log('\n💾 テスト結果を .test-results.json に保存');
        
        return result;
        
    } finally {
        await runner.cleanup();
    }
}

// 直接実行された場合
if (require.main === module) {
    runPlaywrightTest()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { runPlaywrightTest };