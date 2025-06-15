#!/usr/bin/env node

/**
 * ゲームテスト実行スクリプト
 * Puppeteerを使ってブラウザでテストを自動実行し、結果をコンソールに出力
 */

const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');

// HTTPサーバーが動作しているかチェック
async function checkServer(port = 8080) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// テスト実行
async function runTests() {
    console.log('🧪 ゲームテスト実行開始...\n');
    
    // サーバーチェック
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error('❌ HTTPサーバーが起動していません');
        console.error('以下のコマンドでサーバーを起動してください:');
        console.error('python3 -m http.server 8080');
        process.exit(1);
    }
    
    console.log('✅ HTTPサーバー確認完了');
    
    let browser;
    try {
        // Puppeteer起動
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // コンソールログを出力
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                console.error(`🔴 ${text}`);
            } else if (text.includes('✓') || text.includes('✗')) {
                console.log(text);
            } else if (text.includes('===') || text.includes('テスト')) {
                console.log(text);
            }
        });
        
        // エラーキャッチ
        page.on('pageerror', error => {
            console.error(`💥 ページエラー: ${error.message}`);
        });
        
        console.log('🌐 テストページにアクセス中...');
        
        // テストページにアクセス
        await page.goto('http://localhost:8080/tests/test.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // テスト完了まで待機
        console.log('⏳ テスト実行中...');
        await page.waitForTimeout(3000); // テスト実行時間を待つ
        
        // テスト結果を取得
        const testResults = await page.evaluate(() => {
            const resultContainer = document.getElementById('testResults');
            if (!resultContainer) return null;
            
            // 全体結果の取得
            const overallSummary = resultContainer.querySelector('.overall-summary');
            const isSuccess = overallSummary && overallSummary.classList.contains('test-pass');
            
            // 詳細結果の取得
            const testCategories = Array.from(resultContainer.querySelectorAll('.test-category'));
            const categories = testCategories.map(category => {
                const title = category.querySelector('h3').textContent;
                const isPass = category.classList.contains('category-pass');
                const summary = category.querySelector('.category-summary').textContent;
                
                const testItems = Array.from(category.querySelectorAll('.test-item')).map(item => {
                    return {
                        text: item.textContent,
                        passed: item.classList.contains('test-pass')
                    };
                });
                
                return {
                    title,
                    passed: isPass,
                    summary,
                    tests: testItems
                };
            });
            
            return {
                overallSuccess: isSuccess,
                categories
            };
        });
        
        if (!testResults) {
            console.error('❌ テスト結果を取得できませんでした');
            process.exit(1);
        }
        
        // 結果出力
        console.log('\n📊 テスト結果:');
        console.log('=====================================');
        
        if (testResults.overallSuccess) {
            console.log('🎉 全テスト成功！');
        } else {
            console.log('⚠️  テスト失敗あり');
        }
        
        console.log('\n📋 カテゴリ別結果:');
        for (const category of testResults.categories) {
            const icon = category.passed ? '✅' : '❌';
            console.log(`\n${icon} ${category.title}`);
            console.log(`   ${category.summary}`);
            
            // 失敗したテストのみ詳細表示
            if (!category.passed) {
                console.log('   失敗したテスト:');
                category.tests.forEach(test => {
                    if (!test.passed) {
                        console.log(`   • ${test.text}`);
                    }
                });
            }
        }
        
        console.log('\n=====================================');
        
        // 終了コード設定
        if (!testResults.overallSuccess) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`💥 テスト実行エラー: ${error.message}`);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// メイン実行
if (require.main === module) {
    runTests().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runTests };