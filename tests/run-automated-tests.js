#!/usr/bin/env node

/**
 * 自動テストランナー
 * Node.jsとブラウザ両環境で実行可能
 */

const fs = require('fs');
const path = require('path');

// テスト結果を保存
function saveTestResults(results) {
    const outputPath = path.join(__dirname, '..', 'automated-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 テスト結果を保存しました: ${outputPath}`);
}

// メイン実行
async function main() {
    console.log('🚀 自動ゲームテストを開始します...\n');
    
    try {
        // モジュールの読み込み
        const AutomatedGameTests = require('./automated-game-tests.js');
        
        // テストインスタンスの作成
        const tester = new AutomatedGameTests();
        
        // 全テストの実行
        const results = await tester.runAllTests();
        
        // 結果の保存
        saveTestResults(results);
        
        // 終了ステータスの設定
        if (results.summary.failed > 0) {
            console.log('\n⚠️  一部のテストが失敗しました');
            process.exit(1);
        } else {
            console.log('\n✨ すべてのテストが成功しました！');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n❌ テスト実行中にエラーが発生しました:', error);
        process.exit(1);
    }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
    main();
}

module.exports = { main };