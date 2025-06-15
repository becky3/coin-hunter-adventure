#!/usr/bin/env node

/**
 * working-test.htmlの結果を確実に取得するスクリプト
 */

const http = require('http');

async function getTestResults() {
    return new Promise((resolve, reject) => {
        // 初回アクセスでページ読み込み
        const req1 = http.get('http://localhost:8080/tests/working-test.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // 5秒待機してテスト実行完了を待つ
                setTimeout(() => {
                    // 再度アクセスして結果を取得
                    const req2 = http.get('http://localhost:8080/tests/working-test.html', (res2) => {
                        let finalData = '';
                        res2.on('data', chunk => finalData += chunk);
                        res2.on('end', () => resolve(finalData));
                    });
                    req2.on('error', reject);
                }, 5000);
            });
        });
        req1.on('error', reject);
    });
}

function parseResults(html) {
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };
    
    // 成功メッセージの抽出
    const successMatches = html.match(/<div class="test-result success">([^<]+)<\/div>/g) || [];
    successMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text.includes('✓')) {
            results.passed++;
            results.details.push({ success: true, message: text });
        }
    });
    
    // 失敗メッセージの抽出
    const errorMatches = html.match(/<div class="test-result error">([^<]+)<\/div>/g) || [];
    errorMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text.includes('✗')) {
            results.failed++;
            results.details.push({ success: false, message: text });
        }
    });
    
    results.total = results.passed + results.failed;
    
    // サマリー情報の抽出
    const summaryMatch = html.match(/合計:\s*(\d+)件[\s\S]*?成功:\s*(\d+)件[\s\S]*?失敗:\s*(\d+)件/);
    if (summaryMatch) {
        results.total = parseInt(summaryMatch[1]);
        results.passed = parseInt(summaryMatch[2]);
        results.failed = parseInt(summaryMatch[3]);
    }
    
    return results;
}

async function main() {
    console.log('🔍 working-test.html の結果を取得中...\n');
    
    try {
        const html = await getTestResults();
        const results = parseResults(html);
        
        console.log('📊 テスト結果:');
        console.log('=====================================');
        console.log(`合計: ${results.total}件`);
        console.log(`✅ 成功: ${results.passed}件`);
        console.log(`❌ 失敗: ${results.failed}件`);
        console.log(`📈 成功率: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);
        console.log('=====================================');
        
        if (results.details.length > 0) {
            console.log('\n詳細:');
            results.details.forEach(detail => {
                if (detail.success) {
                    console.log(`  ${detail.message}`);
                } else {
                    console.log(`  ${detail.message}`);
                }
            });
        }
        
        if (results.failed === 0 && results.passed > 0) {
            console.log('\n🎉 全てのテストが成功しました！');
        } else if (results.failed > 0) {
            console.log(`\n⚠️  ${results.failed}件のテストが失敗しています。`);
        } else {
            console.log('\n❓ テスト結果を取得できませんでした。');
        }
        
        return results;
        
    } catch (error) {
        console.error(`💥 エラー: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getTestResults: main };