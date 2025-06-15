#!/usr/bin/env node

/**
 * test.htmlの実際の結果を取得・解析するスクリプト
 */

const http = require('http');

async function fetchTestPage(waitTime = 10000) {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/tests/test.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                setTimeout(() => resolve(data), waitTime);
            });
        });
        req.on('error', reject);
    });
}

function parseTestResults(html) {
    const results = {
        overallStatus: 'unknown',
        totalPassed: 0,
        totalFailed: 0,
        totalTests: 0,
        categories: [],
        details: []
    };
    
    try {
        // 全体結果の解析
        if (html.includes('overall-summary test-pass')) {
            results.overallStatus = 'success';
        } else if (html.includes('overall-summary test-fail')) {
            results.overallStatus = 'failed';
        } else if (html.includes('テストを実行中...')) {
            results.overallStatus = 'running';
        }
        
        // 数値の抽出
        const summaryRegex = /合計:\s*(\d+)件\s*\|\s*成功:\s*(\d+)件\s*\|\s*失敗:\s*(\d+)件/;
        const summaryMatch = html.match(summaryRegex);
        if (summaryMatch) {
            results.totalTests = parseInt(summaryMatch[1]);
            results.totalPassed = parseInt(summaryMatch[2]);
            results.totalFailed = parseInt(summaryMatch[3]);
        }
        
        // カテゴリ別結果の解析
        const categoryRegex = /<h3>([✅❌][^<]+)<\/h3>[\s\S]*?<div class="category-summary[^>]*>([^<]+)<\/div>/g;
        let categoryMatch;
        
        while ((categoryMatch = categoryRegex.exec(html)) !== null) {
            const [, title, summary] = categoryMatch;
            const isPass = title.includes('✅');
            
            // カテゴリの成功/失敗数を抽出
            const catSummaryMatch = summary.match(/成功:\s*(\d+).*失敗:\s*(\d+).*合計:\s*(\d+)/);
            if (catSummaryMatch) {
                results.categories.push({
                    title: title.replace(/[✅❌]/g, '').trim(),
                    passed: isPass,
                    success: parseInt(catSummaryMatch[1]),
                    failed: parseInt(catSummaryMatch[2]),
                    total: parseInt(catSummaryMatch[3])
                });
            }
        }
        
        // 失敗した個別テストの抽出
        const failureRegex = /<div class="test-item test-fail">✗\s*([^<]+)<\/div>/g;
        let failureMatch;
        
        while ((failureMatch = failureRegex.exec(html)) !== null) {
            results.details.push(`❌ ${failureMatch[1].trim()}`);
        }
        
    } catch (error) {
        console.error('HTML解析エラー:', error.message);
    }
    
    return results;
}

async function checkTestHtml() {
    console.log('🔍 test.html の実行結果を確認中...\n');
    
    try {
        const html = await fetchTestPage(12000);
        const results = parseTestResults(html);
        
        console.log('📊 テスト結果:');
        console.log('=====================================');
        
        const statusIcon = {
            'success': '🎉',
            'failed': '❌',
            'running': '⏳',
            'unknown': '❓'
        }[results.overallStatus] || '❓';
        
        console.log(`${statusIcon} 全体状況: ${results.overallStatus}`);
        
        if (results.totalTests > 0) {
            console.log(`📈 全体結果: ${results.totalTests}件中 成功${results.totalPassed}件、失敗${results.totalFailed}件`);
            console.log(`📊 成功率: ${((results.totalPassed / results.totalTests) * 100).toFixed(1)}%`);
        } else {
            console.log('📊 テスト結果が取得できませんでした');
        }
        
        if (results.categories.length > 0) {
            console.log('\n📋 カテゴリ別詳細:');
            results.categories.forEach(cat => {
                const icon = cat.passed ? '✅' : '❌';
                console.log(`${icon} ${cat.title}: ${cat.total}件中 成功${cat.success}件、失敗${cat.failed}件`);
            });
        }
        
        if (results.details.length > 0) {
            console.log('\n🔍 失敗したテスト:');
            results.details.forEach(detail => console.log(`   ${detail}`));
        }
        
        console.log('\n=====================================');
        
        // テスト実行状況の判定
        if (results.overallStatus === 'running') {
            console.log('⚠️  テストが実行中です。JavaScriptの処理が完了していません。');
        } else if (results.overallStatus === 'unknown') {
            console.log('❓ テスト状況が不明です。ページの読み込みに問題がある可能性があります。');
        } else if (results.totalFailed > 0) {
            console.log(`❌ ${results.totalFailed}件のテストが失敗しています。修正が必要です。`);
        } else if (results.totalPassed > 0) {
            console.log('🎉 全てのテストが成功しています！');
        }
        
        return results;
        
    } catch (error) {
        console.error(`💥 テスト確認エラー: ${error.message}`);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    checkTestHtml().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checkTestHtml };