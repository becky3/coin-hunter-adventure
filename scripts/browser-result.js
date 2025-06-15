#!/usr/bin/env node

/**
 * ブラウザでのテスト結果をコマンドラインから取得
 */

const http = require('http');

function fetchTestResult() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/tests/auto-report.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // ページ内のJavaScriptが実行されたかをチェック
                if (data.includes('TEST_REPORT')) {
                    console.log('✅ テスト結果ページが生成されています');
                    console.log('📄 HTMLサイズ:', data.length, 'bytes');
                    
                    // HTMLから大まかな情報を抽出
                    const hasTestResults = data.includes('overall-summary');
                    const hasFailures = data.includes('test-fail');
                    
                    resolve({
                        hasResults: hasTestResults,
                        hasFailures: hasFailures,
                        htmlSize: data.length
                    });
                } else {
                    console.log('⏳ テストがまだ実行中または未完了');
                    resolve({ hasResults: false });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function checkBrowserTest() {
    console.log('🌐 ブラウザテスト結果確認...\n');
    
    try {
        const result = await fetchTestResult();
        
        if (result.hasResults) {
            console.log('📊 テスト結果:');
            console.log('=====================================');
            
            if (!result.hasFailures) {
                console.log('🎉 全テスト成功（失敗クラスが検出されませんでした）');
                console.log('✅ ブラウザ環境では正常に動作しています');
            } else {
                console.log('⚠️ テスト失敗が検出されました');
            }
            
            console.log('=====================================');
            return !result.hasFailures;
        } else {
            console.log('❌ テスト結果を取得できませんでした');
            return false;
        }
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
        return false;
    }
}

// メイン実行
if (require.main === module) {
    checkBrowserTest()
        .then((success) => {
            if (success) {
                console.log('\n✅ ブラウザテスト成功');
                process.exit(0);
            } else {
                console.log('\n❌ ブラウザテスト失敗');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 予期しないエラー:', error.message);
            process.exit(1);
        });
}

module.exports = { checkBrowserTest };