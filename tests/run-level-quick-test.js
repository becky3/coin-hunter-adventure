#!/usr/bin/env node

/**
 * 簡易レベルテスト実行スクリプト
 * 短時間でレベルの基本的な問題を検出
 */

const fs = require('fs');

// グローバル変数をセットアップ
global.performance = {
    now: () => Date.now()
};

// 設定ファイルを読み込み
console.log('レベルデータを読み込み中...');
eval(fs.readFileSync('config.js', 'utf8'));
eval(fs.readFileSync('levels.js', 'utf8'));

// 簡易テストモジュールを読み込み
eval(fs.readFileSync('test-levelplay-simple.js', 'utf8'));

// SimpleLevelTestクラスが正しく読み込まれたか確認
if (typeof SimpleLevelTest === 'undefined') {
    console.error('SimpleLevelTestクラスが読み込まれませんでした');
    process.exit(1);
}

// メイン実行
async function main() {
    console.log('=== 簡易レベルテストシステム ===');
    
    const simpleLevelTest = new SimpleLevelTest();
    
    // コマンドライン引数でレベル名を指定可能
    const levelName = process.argv[2] || 'default';
    console.log(`レベル: ${levelName}`);
    
    try {
        // 簡易テスト実行
        const result = await simpleLevelTest.runQuickTest();
        
        // 結果をファイルに保存
        const report = {
            timestamp: new Date().toISOString(),
            levelName: levelName,
            type: 'quick',
            result: result
        };
        
        const reportPath = `quick-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nレポートを保存しました: ${reportPath}`);
        
        // 終了コード設定
        process.exit(result.passed ? 0 : 1);
        
    } catch (error) {
        console.error('エラーが発生しました:', error.message);
        process.exit(1);
    }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
    console.error('予期しないエラー:', error.message);
    process.exit(1);
});

// 実行
main();