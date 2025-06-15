#!/usr/bin/env node

/**
 * Puppeteerを使用してブラウザでテストを実行し、結果を取得
 */

const puppeteer = require('puppeteer');

async function runPuppeteerTest() {
    console.log('🧪 Puppeteerテスト実行開始...\n');
    
    let browser;
    try {
        // ブラウザ起動
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // コンソールログを出力
        page.on('console', msg => {
            if (msg.text().includes('テスト完了:')) {
                console.log('テスト実行検出');
            }
        });
        
        // エラーキャッチ
        page.on('pageerror', error => {
            console.error(`ページエラー: ${error.message}`);
        });
        
        console.log('📄 test.html にアクセス中...');
        
        // test.html にアクセス
        await page.goto('http://localhost:8080/tests/test.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏳ テスト実行を待機中...');
        
        // テスト完了まで待機（最大20秒）
        await page.waitForTimeout(10000);
        
        // テスト結果を取得
        const results = await page.evaluate(() => {
            // overall-summary を探す
            const overallSummary = document.querySelector('.overall-summary');
            if (!overallSummary) {
                return { status: 'not-found', message: 'テスト結果が見つかりません' };
            }
            
            // 成功/失敗のクラスをチェック
            const isSuccess = overallSummary.classList.contains('test-pass');
            const isFail = overallSummary.classList.contains('test-fail');
            
            // テキスト内容を取得
            const summaryText = overallSummary.textContent || '';
            
            // 数値を抽出
            const totalMatch = summaryText.match(/合計:\s*(\d+)件/);
            const passedMatch = summaryText.match(/成功:\s*(\d+)件/);
            const failedMatch = summaryText.match(/失敗:\s*(\d+)件/);
            
            const total = totalMatch ? parseInt(totalMatch[1]) : 0;
            const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
            const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
            
            // カテゴリ別結果も取得
            const categories = [];
            const categoryElements = document.querySelectorAll('.test-category');
            categoryElements.forEach(cat => {
                const titleEl = cat.querySelector('h3');
                const summaryEl = cat.querySelector('.category-summary');
                if (titleEl && summaryEl) {
                    categories.push({
                        title: titleEl.textContent.trim(),
                        summary: summaryEl.textContent.trim(),
                        passed: cat.classList.contains('category-pass')
                    });
                }
            });
            
            // 失敗したテストの詳細
            const failures = [];
            const failItems = document.querySelectorAll('.test-item.test-fail');
            failItems.forEach(item => {
                failures.push(item.textContent.trim());
            });
            
            return {
                status: isSuccess ? 'success' : (isFail ? 'failed' : 'running'),
                total,
                passed,
                failed,
                categories,
                failures,
                summaryText
            };
        });
        
        // 結果表示
        console.log('\n📊 テスト結果:');
        console.log('=====================================');
        
        if (results.status === 'not-found') {
            console.log('❌ テスト結果を取得できませんでした');
            console.log('   テストがまだ実行中か、エラーが発生した可能性があります');
        } else if (results.status === 'running') {
            console.log('⏳ テストがまだ実行中です');
            console.log(`   現在の状態: ${results.summaryText}`);
        } else {
            const icon = results.status === 'success' ? '🎉' : '❌';
            console.log(`${icon} 状態: ${results.status}`);
            console.log(`📈 合計: ${results.total}件`);
            console.log(`✅ 成功: ${results.passed}件`);
            console.log(`❌ 失敗: ${results.failed}件`);
            
            if (results.total > 0) {
                const successRate = ((results.passed / results.total) * 100).toFixed(1);
                console.log(`📊 成功率: ${successRate}%`);
            }
            
            if (results.categories.length > 0) {
                console.log('\n📋 カテゴリ別結果:');
                results.categories.forEach(cat => {
                    const icon = cat.passed ? '✅' : '❌';
                    console.log(`${icon} ${cat.title}`);
                    console.log(`   ${cat.summary}`);
                });
            }
            
            if (results.failures.length > 0) {
                console.log('\n🔍 失敗したテスト:');
                results.failures.forEach(failure => {
                    console.log(`   ${failure}`);
                });
            }
        }
        
        console.log('\n=====================================');
        
        if (results.failed > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`💥 エラー: ${error.message}`);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// メイン実行
if (require.main === module) {
    runPuppeteerTest().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runPuppeteerTest };