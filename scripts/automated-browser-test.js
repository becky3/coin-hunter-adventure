/**
 * 自動ブラウザテスト実行スクリプト
 * Puppeteerを使用してhttp://localhost:8080/tests/test.htmlのテストを実行
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runBrowserTests() {
    let browser = null;
    
    try {
        console.log('🚀 ブラウザテスト自動実行を開始...');
        
        // ブラウザを起動
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // コンソールログを取得
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
            if (text.includes('TEST:') || text.includes('📊') || text.includes('✅') || text.includes('❌')) {
                console.log(text);
            }
        });
        
        // エラーを取得
        page.on('pageerror', error => {
            console.error('❌ ページエラー:', error.message);
            logs.push(`ERROR: ${error.message}`);
        });
        
        console.log('📄 テストページにアクセス中...');
        await page.goto('http://localhost:8080/tests/test.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏳ テスト実行を待機中...');
        
        // テスト完了まで待機（最大60秒）
        await page.waitForFunction(() => {
            const testResults = document.getElementById('testResults');
            return testResults && testResults.innerHTML.includes('テスト実行結果');
        }, { timeout: 60000 });
        
        console.log('📊 テスト結果を取得中...');
        
        // テスト結果を取得
        const testResults = await page.evaluate(() => {
            const resultsElement = document.getElementById('testResults');
            if (!resultsElement) {
                return { error: 'テスト結果要素が見つかりません' };
            }
            
            // 全体サマリーを取得
            const overallSummary = resultsElement.querySelector('.overall-summary');
            if (!overallSummary) {
                return { error: '全体サマリーが見つかりません' };
            }
            
            const summaryText = overallSummary.textContent;
            const isSuccess = summaryText.includes('全テスト成功');
            
            // 数値を抽出
            const totalMatch = summaryText.match(/合計:\s*(\d+)件/);
            const successMatch = summaryText.match(/成功:\s*(\d+)件/);
            const failedMatch = summaryText.match(/失敗:\s*(\d+)件/);
            
            const total = totalMatch ? parseInt(totalMatch[1]) : 0;
            const success = successMatch ? parseInt(successMatch[1]) : 0;
            const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
            
            // カテゴリ別結果を取得
            const categories = [];
            const categoryElements = resultsElement.querySelectorAll('.test-category');
            
            categoryElements.forEach(catElement => {
                const title = catElement.querySelector('h3')?.textContent || '';
                const summary = catElement.querySelector('.category-summary')?.textContent || '';
                
                const categoryData = {
                    name: title.replace(/[✅❌]\s*/, ''),
                    success: title.includes('✅'),
                    details: summary
                };
                
                // 失敗したテストの詳細を取得
                const failedTests = [];
                const testItems = catElement.querySelectorAll('.test-item.test-fail');
                testItems.forEach(item => {
                    failedTests.push(item.textContent.replace('✗ ', ''));
                });
                
                if (failedTests.length > 0) {
                    categoryData.failedTests = failedTests;
                }
                
                categories.push(categoryData);
            });
            
            return {
                success: isSuccess,
                total: total,
                passed: success,
                failed: failed,
                successRate: total > 0 ? Math.round((success / total) * 100) : 0,
                categories: categories,
                timestamp: new Date().toISOString()
            };
        });
        
        if (testResults.error) {
            throw new Error(testResults.error);
        }
        
        // 結果を表示
        console.log('\n📊 ブラウザテスト結果:');
        console.log('=====================================');
        console.log(`🎯 状態: ${testResults.success ? '全テスト成功' : 'テスト失敗あり'}`);
        console.log(`📈 合計: ${testResults.total}件`);
        console.log(`✅ 成功: ${testResults.passed}件`);
        console.log(`❌ 失敗: ${testResults.failed}件`);
        console.log(`📊 成功率: ${testResults.successRate}%`);
        console.log('=====================================');
        
        // カテゴリ別結果
        console.log('\n📋 カテゴリ別結果:');
        testResults.categories.forEach(category => {
            const icon = category.success ? '✅' : '❌';
            console.log(`${icon} ${category.name}`);
            console.log(`   ${category.details}`);
            if (category.failedTests) {
                console.log(`   失敗: ${category.failedTests.join(', ')}`);
            }
        });
        
        // 結果をJSONファイルに保存
        const resultData = {
            status: testResults.success ? 'success' : 'failed',
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: testResults.successRate,
            verificationMethod: 'automated_browser_test',
            timestamp: new Date().toLocaleString('ja-JP'),
            categories: testResults.categories,
            details: {
                systemTest: null,
                svgRenderingTest: null,
                levelTest: null
            }
        };
        
        // カテゴリ詳細を解析
        testResults.categories.forEach(category => {
            if (category.name.includes('システムテスト')) {
                const match = category.details.match(/成功:\s*(\d+)/);
                resultData.details.systemTest = match ? `${match[1]}件成功` : category.details;
            } else if (category.name.includes('SVGレンダリングテスト')) {
                const match = category.details.match(/成功:\s*(\d+)/);
                resultData.details.svgRenderingTest = match ? `${match[1]}件成功` : category.details;
            } else if (category.name.includes('レベルテスト')) {
                const match = category.details.match(/成功:\s*(\d+)/);
                resultData.details.levelTest = match ? `${match[1]}件成功` : category.details;
            }
        });
        
        const resultsFile = path.join(__dirname, '..', '.test-results.json');
        fs.writeFileSync(resultsFile, JSON.stringify(resultData, null, 2));
        
        console.log(`\n💾 テスト結果を保存: ${resultsFile}`);
        console.log(`🎉 ブラウザテスト${testResults.success ? '成功' : '失敗'}！`);
        
        return testResults;
        
    } catch (error) {
        console.error('❌ ブラウザテスト実行エラー:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 直接実行された場合
if (require.main === module) {
    runBrowserTests()
        .then(results => {
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { runBrowserTests };