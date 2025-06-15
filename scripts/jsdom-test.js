#!/usr/bin/env node

/**
 * jsdomを使用してテストを実行し、結果を取得
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function runJSDOMTest() {
    console.log('🧪 JSDOM テスト実行開始...\n');
    
    try {
        // test.htmlを読み込み
        const htmlPath = path.join(__dirname, '..', 'tests', 'test.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        
        // jsdomでDOM環境を作成
        const dom = new JSDOM(html, {
            url: 'http://localhost:8080/tests/test.html',
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true,
            beforeParse(window) {
                // グローバル変数を設定
                window.DISABLE_CORS_WARNING = true;
                window.TEST_MODE = true;
                
                // console.logをキャプチャ
                window.console.log = (...args) => {
                    if (args[0] && args[0].includes('テスト')) {
                        console.log('TEST:', ...args);
                    }
                };
            }
        });
        
        const { window } = dom;
        
        // テスト完了を待つ（最大20秒）
        let attempts = 0;
        const maxAttempts = 40;
        
        const checkResults = () => {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    attempts++;
                    
                    const overallSummary = window.document.querySelector('.overall-summary');
                    
                    if (overallSummary || attempts >= maxAttempts) {
                        clearInterval(interval);
                        
                        if (!overallSummary) {
                            resolve({ status: 'timeout' });
                            return;
                        }
                        
                        // 結果を解析
                        const summaryText = overallSummary.textContent || '';
                        const isSuccess = overallSummary.classList.contains('test-pass');
                        const isFail = overallSummary.classList.contains('test-fail');
                        
                        const totalMatch = summaryText.match(/合計:\s*(\d+)件/);
                        const passedMatch = summaryText.match(/成功:\s*(\d+)件/);
                        const failedMatch = summaryText.match(/失敗:\s*(\d+)件/);
                        
                        const results = {
                            status: isSuccess ? 'success' : (isFail ? 'failed' : 'unknown'),
                            total: totalMatch ? parseInt(totalMatch[1]) : 0,
                            passed: passedMatch ? parseInt(passedMatch[1]) : 0,
                            failed: failedMatch ? parseInt(failedMatch[1]) : 0,
                            summaryText
                        };
                        
                        // カテゴリ情報も取得
                        const categories = [];
                        window.document.querySelectorAll('.test-category').forEach(cat => {
                            const title = cat.querySelector('h3');
                            const summary = cat.querySelector('.category-summary');
                            if (title && summary) {
                                categories.push({
                                    title: title.textContent.trim(),
                                    summary: summary.textContent.trim(),
                                    passed: cat.classList.contains('category-pass')
                                });
                            }
                        });
                        results.categories = categories;
                        
                        // 失敗テスト詳細
                        const failures = [];
                        window.document.querySelectorAll('.test-item.test-fail').forEach(item => {
                            failures.push(item.textContent.trim());
                        });
                        results.failures = failures;
                        
                        resolve(results);
                    }
                }, 500);
            });
        };
        
        console.log('⏳ テスト実行を待機中...');
        const results = await checkResults();
        
        // 結果表示
        console.log('\n📊 テスト結果:');
        console.log('=====================================');
        
        if (results.status === 'timeout') {
            console.log('⏱️ タイムアウト: テストが完了しませんでした');
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
            
            if (results.categories && results.categories.length > 0) {
                console.log('\n📋 カテゴリ別結果:');
                results.categories.forEach(cat => {
                    const icon = cat.passed ? '✅' : '❌';
                    console.log(`${icon} ${cat.title}`);
                    console.log(`   ${cat.summary}`);
                });
            }
            
            if (results.failures && results.failures.length > 0) {
                console.log('\n🔍 失敗したテスト:');
                results.failures.forEach(failure => {
                    console.log(`   ${failure}`);
                });
            }
        }
        
        console.log('\n=====================================');
        
        dom.window.close();
        
        if (results.failed > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`💥 エラー: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    runJSDOMTest().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runJSDOMTest };