#!/usr/bin/env node

/**
 * ブラウザテスト結果読み取りスクリプト
 * test.htmlにアクセスしてテスト結果を取得・解析
 */

const http = require('http');

function fetchTestResults() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/tests/test.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // テスト実行を待つため少し遅延
                setTimeout(() => {
                    // 再度取得して最新の結果を得る
                    const req2 = http.get('http://localhost:8080/tests/test.html', (res2) => {
                        let finalData = '';
                        res2.on('data', chunk => finalData += chunk);
                        res2.on('end', () => resolve(finalData));
                    });
                    req2.on('error', reject);
                }, 2000);
            });
        });
        req.on('error', reject);
    });
}

async function runBrowserTest() {
    console.log('🌐 ブラウザテスト結果取得中...\n');
    
    try {
        const html = await fetchTestResults();
        
        // HTMLからテスト結果情報を抽出
        const failedTests = [];
        const passedTests = [];
        
        // JavaScriptの実行結果を待つため、test-resultsの内容をチェック
        if (html.includes('テストを実行中...')) {
            console.log('⚠️  テストがまだ実行中です。少し待ってから再実行してください。');
            return;
        }
        
        // test-fail クラスの要素を検索
        const testFailRegex = /<div class="test-item test-fail"[^>]*>([^<]+)</g;
        let match;
        while ((match = testFailRegex.exec(html)) !== null) {
            failedTests.push(match[1].trim());
        }
        
        // test-pass クラスの要素を検索
        const testPassRegex = /<div class="test-item test-pass"[^>]*>([^<]+)</g;
        while ((match = testPassRegex.exec(html)) !== null) {
            passedTests.push(match[1].trim());
        }
        
        // overall-summary のチェック
        const isOverallSuccess = html.includes('overall-summary test-pass');
        const isOverallFail = html.includes('overall-summary test-fail');
        
        console.log('📊 テスト結果解析:');
        console.log('=====================================');
        
        if (isOverallSuccess) {
            console.log('🎉 全テスト成功！');
        } else if (isOverallFail) {
            console.log('⚠️  テスト失敗あり');
        } else {
            console.log('❓ テスト結果が不明です（まだ実行中の可能性があります）');
        }
        
        console.log(`✅ 成功したテスト: ${passedTests.length}件`);
        console.log(`❌ 失敗したテスト: ${failedTests.length}件`);
        
        if (failedTests.length > 0) {
            console.log('\n🔍 失敗したテスト詳細:');
            failedTests.forEach((test, index) => {
                console.log(`${index + 1}. ${test}`);
            });
        }
        
        if (passedTests.length > 0 && failedTests.length === 0) {
            console.log('\n✅ 成功したテスト (一部):');
            passedTests.slice(0, 5).forEach((test, index) => {
                console.log(`${index + 1}. ${test}`);
            });
            if (passedTests.length > 5) {
                console.log(`... 他 ${passedTests.length - 5}件`);
            }
        }
        
        console.log('\n=====================================');
        
        // ブラウザで確認する方法を案内
        console.log('🌐 詳細な結果は以下のURLで確認できます:');
        console.log('http://localhost:8080/tests/test.html');
        
        // 失敗があれば終了コード1
        if (failedTests.length > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`❌ テスト結果取得エラー: ${error.message}`);
        console.error('HTTPサーバーが起動していることを確認してください。');
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    runBrowserTest().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runBrowserTest };