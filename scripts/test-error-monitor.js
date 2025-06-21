#!/usr/bin/env node

/**
 * エラー監視システムのテスト
 */

const ErrorMonitor = require('./error-monitor');

console.log('🧪 エラー監視システムのテストを開始します...\n');

const monitor = new ErrorMonitor();

// 監視を開始
monitor.start();
console.log('✅ エラー監視を開始しました');

// テスト用のエラーと警告を生成
console.log('\n📝 テスト用のエラーと警告を生成します...');

// エラーを発生させる
console.error('テストエラー1: ファイルが見つかりません');
console.error('テストエラー2: 接続が拒否されました');
console.error('テストエラー1: ファイルが見つかりません'); // 同じエラーを再度発生

// 警告を発生させる
console.warn('テスト警告1: メモリ使用量が高くなっています');
console.warn('テスト警告2: 非推奨のAPIを使用しています');

// 無視されるべきエラー（JSDOMの警告）
console.error('Error: Not implemented: HTMLCanvasElement.prototype.getContext');
console.warn('ExperimentalWarning: The ESM module loader is experimental.');

// 少し待機してから結果を確認
setTimeout(() => {
    // 監視を停止
    monitor.stop();
    console.log('\n✅ エラー監視を停止しました');
    
    // 結果を取得
    const results = monitor.getTestResults();
    console.log('\n📊 テスト結果:');
    console.log(`  エラー数: ${results.errorCount}`);
    console.log(`  警告数: ${results.warningCount}`);
    console.log(`  テスト合格: ${results.passed ? '✅' : '❌'}`);
    
    // レポートを表示
    monitor.displayReport();
    
    // 期待される結果の検証
    console.log('\n🔍 検証結果:');
    const expectedErrors = 3; // 2つのユニークなエラー、1つは重複
    const expectedWarnings = 2;
    
    if (results.errorCount === expectedErrors) {
        console.log(`✅ エラー数が正しく検出されました (${expectedErrors}件)`);
    } else {
        console.log(`❌ エラー数が期待値と異なります (期待: ${expectedErrors}, 実際: ${results.errorCount})`);
    }
    
    if (results.warningCount === expectedWarnings) {
        console.log(`✅ 警告数が正しく検出されました (${expectedWarnings}件)`);
    } else {
        console.log(`❌ 警告数が期待値と異なります (期待: ${expectedWarnings}, 実際: ${results.warningCount})`);
    }
    
    // 無視パターンの検証
    console.log('\n🔍 無視パターンのテスト:');
    monitor.clear();
    monitor.start();
    
    // 無視されるべきエラーのみを発生
    console.error('Error: Not implemented: HTMLCanvasElement.prototype.getContext');
    console.warn('ExperimentalWarning: The ESM module loader is experimental.');
    
    monitor.stop();
    const ignoredResults = monitor.getTestResults();
    
    if (ignoredResults.errorCount === 0 && ignoredResults.warningCount === 0) {
        console.log('✅ 無視パターンが正しく機能しています');
    } else {
        console.log(`❌ 無視パターンが正しく機能していません (エラー: ${ignoredResults.errorCount}, 警告: ${ignoredResults.warningCount})`);
    }
    
    // 終了
    const success = results.errorCount === expectedErrors && 
                   results.warningCount === expectedWarnings && 
                   ignoredResults.errorCount === 0 && 
                   ignoredResults.warningCount === 0;
    
    console.log(`\n${success ? '✅' : '❌'} エラー監視システムのテストが${success ? '成功' : '失敗'}しました`);
    process.exit(success ? 0 : 1);
}, 100);