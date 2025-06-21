#!/usr/bin/env node

/**
 * エラーがある状態でのテスト実行シミュレーション
 * 統合テストランナーがエラーを検出してテストを失敗させる様子を確認
 */

console.log('🧪 エラーがある状態でのテスト実行をシミュレーション\n');
console.log('（実際のゲームコードは変更せず、エラーを注入してテストします）\n');

// ErrorMonitorを直接使用してシミュレーション
const ErrorMonitor = require('./error-monitor');
const monitor = new ErrorMonitor();

console.log('1️⃣ テスト開始...');
monitor.start();
console.log('✅ エラー監視を開始しました\n');

console.log('2️⃣ ゲームテストを実行中...');
// 実際のテスト中に発生しそうなエラーをシミュレート
console.log('  プレイヤー移動テスト... ');
console.error('TypeError: Cannot read property \'velocity\' of undefined at player.js:102:15');
console.log('  ❌ 失敗\n');

console.log('  衝突判定テスト... ');
console.log('  ✅ 成功\n');

console.log('  敵AI動作テスト... ');
console.error('ReferenceError: enemySpeed is not defined at enemy.js:45:10');
console.error('ReferenceError: enemySpeed is not defined at enemy.js:45:10');
console.log('  ❌ 失敗\n');

console.log('  アイテム収集テスト... ');
console.warn('Performance degradation detected: Collection animation is too slow');
console.log('  ⚠️  警告あり\n');

// テスト完了
monitor.stop();

console.log('3️⃣ テスト結果の集計...\n');

const results = monitor.getTestResults();

console.log('============================================================');
console.log('📊 テスト結果サマリー');
console.log('============================================================');
console.log('総テスト数: 4');
console.log('✅ 成功: 2');
console.log('❌ 失敗: 2');
console.log(`🚨 エラー: ${results.errorCount}件`);
console.log(`⚠️  警告: ${results.warningCount}件`);
console.log('============================================================\n');

if (results.errorCount > 0) {
    console.log('❌ エラーが検出されたため、テストは失敗扱いになります');
    console.log('Exit code: 1\n');
    
    console.log('📋 検出されたエラー:');
    results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
    });
    
    console.log('\n💡 次のアクション:');
    console.log('1. 上記のエラーを修正してください');
    console.log('2. 修正後、再度テストを実行してください');
    console.log('3. すべてのエラーが解消されるまでマージはできません');
} else {
    console.log('✅ エラーが検出されませんでした');
    console.log('Exit code: 0');
}

console.log('\n---');
console.log('このように、エラー検出システムは：');
console.log('• テスト中のすべてのエラーを自動的に収集');
console.log('• エラーがあればテストを失敗扱いに');
console.log('• CI/CDパイプラインでエラーを見逃さない');
console.log('• 品質の高いコードの維持に貢献');

process.exit(results.errorCount > 0 ? 1 : 0);