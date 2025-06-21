/**
 * 包括的テスト結果記録ツール
 * 各検証ツールの結果を統合し、問題の特定を支援
 */

const { verifyTestAccessibility } = require('./verify-test-accessibility');
const { checkTestPage } = require('./simple-http-test');
const { testJavaScriptExecution } = require('./lightweight-js-test');
const fs = require('fs');
const path = require('path');

async function runComprehensiveTest() {
    console.log('🔍 包括的テスト実行開始...\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        infrastructure: {},
        javascript: {},
        overall: {}
    };
    
    try {
        // 1. インフラ検証
        console.log('1️⃣ インフラストラクチャ検証');
        console.log('=====================================');
        const infraResult = await verifyTestAccessibility();
        results.infrastructure = infraResult;
        
        // 2. HTTP構成確認
        console.log('\n2️⃣ HTTP構成確認');
        console.log('=====================================');
        const httpResult = await checkTestPage();
        results.http = httpResult;
        
        // 3. JavaScript実行確認
        console.log('\n3️⃣ JavaScript実行確認');
        console.log('=====================================');
        const jsResult = await testJavaScriptExecution();
        results.javascript = jsResult;
        
        // 4. 総合判定
        console.log('\n📊 総合判定');
        console.log('=====================================');
        
        const infraOk = infraResult.success;
        const httpOk = httpResult.success;
        const jsPartialOk = jsResult.results && jsResult.results.config && jsResult.results.levelLoader;
        
        results.overall = {
            infrastructure: infraOk,
            http_structure: httpOk,
            javascript_basic: jsPartialOk,
            javascript_advanced: jsResult.success,
            ready_for_browser_test: infraOk && httpOk && jsPartialOk
        };
        
        console.log(`インフラストラクチャ: ${infraOk ? '✅' : '❌'}`);
        console.log(`HTTP構成: ${httpOk ? '✅' : '❌'}`);
        console.log(`JavaScript基本: ${jsPartialOk ? '✅' : '❌'}`);
        console.log(`JavaScript高度: ${jsResult.success ? '✅' : '❌'}`);
        console.log(`ブラウザテスト準備: ${results.overall.ready_for_browser_test ? '✅' : '❌'}`);
        
        // 5. 問題分析
        console.log('\n🔍 問題分析');
        console.log('=====================================');
        
        if (results.overall.ready_for_browser_test) {
            console.log('✅ 基本的な前提条件は全て満たされています');
            console.log('');
            console.log('🎯 次のアクション:');
            console.log('1. http://localhost:8080/tests/test.html をブラウザで開く');
            console.log('2. テスト結果を確認（20件中何件成功するか）');
            console.log('3. 失敗したテストがあれば具体的なエラーメッセージを確認');
            console.log('');
            console.log('⚠️ 注意: VM環境ではGameクラスの実行に制限があるため、');
            console.log('実際のブラウザでの動作確認が必要です。');
        } else {
            console.log('❌ 以下の問題が検出されました:');
            if (!infraOk) console.log('- インフラストラクチャの問題');
            if (!httpOk) console.log('- HTTP構成の問題');
            if (!jsPartialOk) console.log('- JavaScript基本読み込みの問題');
        }
        
        // 6. .test-results.jsonを更新
        const testResultsPath = path.join(__dirname, '..', '..', 'test-results', '.test-results.json');
        const testResultsData = {
            timestamp: results.timestamp,
            status: results.overall.ready_for_browser_test ? 'ready_for_browser_test' : 'issues_detected',
            verification_summary: {
                infrastructure: infraOk ? '✅' : '❌',
                http_structure: httpOk ? '✅' : '❌', 
                javascript_basic: jsPartialOk ? '✅' : '❌',
                javascript_advanced: jsResult.success ? '✅' : '⚠️ VM制限'
            },
            automated_verification_status: 'completed',
            manual_browser_test_required: true,
            next_action: results.overall.ready_for_browser_test 
                ? 'ブラウザでhttp://localhost:8080/tests/test.htmlを実行'
                : '検出された問題を修正',
            technical_notes: {
                vm_limitation: 'GameクラスのCanvas操作はVM環境で制限される',
                browser_test_essential: '実際の動作確認にはブラウザテストが必須'
            }
        };
        
        fs.writeFileSync(testResultsPath, JSON.stringify(testResultsData, null, 2));
        console.log('\n💾 テスト結果を .test-results.json に保存しました');
        
        return results;
        
    } catch (error) {
        console.error('❌ 包括的テスト実行エラー:', error.message);
        return { error: error.message };
    }
}

// 直接実行された場合
if (require.main === module) {
    runComprehensiveTest()
        .then(result => {
            const success = result.overall && result.overall.ready_for_browser_test;
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveTest };