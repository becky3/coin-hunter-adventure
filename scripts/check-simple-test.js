#!/usr/bin/env node

/**
 * simple-working-test.htmlの結果を取得するスクリプト
 */

const http = require('http');

async function fetchSimpleTest(waitTime = 8000) {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/tests/simple-working-test.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                setTimeout(() => resolve(data), waitTime);
            });
        });
        req.on('error', reject);
    });
}

function parseSimpleResults(html) {
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        status: 'unknown',
        details: []
    };
    
    try {
        // 結果行の抽出
        const resultRegex = /<div class="result\s+([^"]*)"[^>]*>([^<]+)<\/div>/g;
        let match;
        
        while ((match = resultRegex.exec(html)) !== null) {
            const [, className, text] = match;
            
            if (text.includes('✅')) {
                results.details.push(`成功: ${text.trim()}`);
                if (!text.includes('===')) {
                    results.passed++;
                }
            } else if (text.includes('❌')) {
                results.details.push(`失敗: ${text.trim()}`);
                if (!text.includes('===')) {
                    results.failed++;
                }
            } else if (text.includes('合計:')) {
                // 合計行から数値を抽出
                const totalMatch = text.match(/合計:\s*(\d+)件.*成功:\s*(\d+)件.*失敗:\s*(\d+)件/);
                if (totalMatch) {
                    results.total = parseInt(totalMatch[1]);
                    results.passed = parseInt(totalMatch[2]);
                    results.failed = parseInt(totalMatch[3]);
                }
            } else if (text.includes('全テスト成功')) {
                results.status = 'success';
            } else if (text.includes('テストが失敗')) {
                results.status = 'failed';
            }
        }
        
        // ステータスが不明な場合の推定
        if (results.status === 'unknown') {
            if (results.failed === 0 && results.passed > 0) {
                results.status = 'success';
            } else if (results.failed > 0) {
                results.status = 'failed';
            }
        }
        
    } catch (error) {
        console.error('HTML解析エラー:', error.message);
    }
    
    return results;
}

async function checkSimpleTest() {
    console.log('🔍 simple-working-test.html の結果確認中...\n');
    
    try {
        const html = await fetchSimpleTest(10000);
        const results = parseSimpleResults(html);
        
        console.log('📊 テスト結果:');
        console.log('=====================================');
        
        const statusIcon = {
            'success': '🎉',
            'failed': '❌',
            'unknown': '❓'
        }[results.status] || '❓';
        
        console.log(`${statusIcon} 状況: ${results.status}`);
        console.log(`📈 合計: ${results.total}件 | 成功: ${results.passed}件 | 失敗: ${results.failed}件`);
        
        if (results.total > 0) {
            console.log(`📊 成功率: ${((results.passed / results.total) * 100).toFixed(1)}%`);
        }
        
        if (results.details.length > 0) {
            console.log('\n📋 詳細結果:');
            results.details.forEach(detail => {
                console.log(`   ${detail}`);
            });
        }
        
        console.log('\n=====================================');
        
        return results;
        
    } catch (error) {
        console.error(`💥 テスト確認エラー: ${error.message}`);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    checkSimpleTest().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checkSimpleTest };