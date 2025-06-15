#!/usr/bin/env node

/**
 * ブラウザからテスト結果の詳細を取得
 */

const http = require('http');
const fs = require('fs');

async function getExactResults() {
    console.log('🔍 詳細なテスト結果取得...\n');
    
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/tests/test.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // HTMLを一時ファイルに保存
                fs.writeFileSync('/tmp/test_result.html', data);
                
                console.log('📄 test.htmlを取得しました');
                console.log('💾 一時ファイル: /tmp/test_result.html');
                console.log('📊 HTMLサイズ:', data.length, 'bytes');
                
                // テスト結果要素の存在確認
                const hasTestResults = data.includes('testResults');
                const hasOverallSummary = data.includes('overall-summary');
                const hasTestPass = data.includes('test-pass');
                const hasTestFail = data.includes('test-fail');
                
                console.log('\n🔍 HTML内容分析:');
                console.log('- テスト結果要素:', hasTestResults ? '✅' : '❌');
                console.log('- 全体サマリー:', hasOverallSummary ? '✅' : '❌');
                console.log('- 成功クラス:', hasTestPass ? '✅' : '❌');
                console.log('- 失敗クラス:', hasTestFail ? '✅' : '❌');
                
                // JavaScript実行状況の推測
                if (data.includes('Loading...')) {
                    console.log('📡 状況: テスト実行開始前または実行中');
                } else if (data.includes('テスト実行開始')) {
                    console.log('📡 状況: テスト実行が開始されています');
                } else {
                    console.log('📡 状況: 静的HTMLのみ（JavaScript未実行）');
                }
                
                resolve({
                    htmlSize: data.length,
                    hasTestResults,
                    hasOverallSummary,
                    hasTestPass,
                    hasTestFail
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// メイン実行
if (require.main === module) {
    getExactResults()
        .then((result) => {
            console.log('\n📋 取得完了');
            console.log('実際の確認には /tmp/test_result.html を開いてください');
        })
        .catch((error) => {
            console.error('\n💥 エラー:', error.message);
            process.exit(1);
        });
}

module.exports = { getExactResults };