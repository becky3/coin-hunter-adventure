#!/usr/bin/env node

/**
 * エラー検出システムのデモンストレーション
 * 意図的にエラーを発生させて、エラー監視の動作を確認
 */

const ErrorMonitor = require('./error-monitor');

console.log('🎭 エラー検出システムのデモンストレーション\n');
console.log('意図的にエラーを発生させて、検出システムの動作を確認します...\n');

const monitor = new ErrorMonitor();
monitor.start();

// 1. よくあるエラーパターンを再現
console.log('📝 様々なエラーパターンを生成中...\n');

// null参照エラー
try {
    const player = null;
    console.error(`Cannot read property 'x' of null at player.js:45:10`);
    console.error(`Cannot read property 'x' of null at player.js:45:10`); // 同じエラーを繰り返し
    console.error(`Cannot read property 'x' of null at player.js:45:10`);
} catch (e) {}

// undefined参照エラー
try {
    console.error(`Cannot read properties of undefined (reading 'update') at game.js:123:15`);
    console.error(`Cannot read properties of undefined (reading 'update') at game.js:123:15`);
} catch (e) {}

// 関数が見つからないエラー
console.error(`TypeError: enemy.move is not a function at game-loop.js:89:20`);

// ネットワークエラー
console.error(`Failed to fetch: net::ERR_CONNECTION_REFUSED at level-loader.js:34:5`);

// 警告も発生させる
console.warn('Performance warning: Frame rate dropped below 30 FPS');
console.warn('Memory usage is high: 85% of heap used');
console.warn('Deprecated API: AudioContext.createGainNode() is deprecated');

// 無視されるべきエラー（フィルタリングのテスト）
console.error('Error: Not implemented: HTMLCanvasElement.prototype.getContext');
console.warn('ExperimentalWarning: The ESM module loader is experimental.');

// 少し待ってから結果を表示
setTimeout(() => {
    monitor.stop();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 検出結果\n');
    
    const results = monitor.getTestResults();
    console.log(`🔴 検出されたエラー: ${results.errorCount}件`);
    console.log(`🟡 検出された警告: ${results.warningCount}件`);
    console.log(`✅ 無視されたエラー: 2件（Canvas, ESM関連）\n`);
    
    // 詳細なレポートを表示
    monitor.displayReport();
    
    console.log('\n💡 このように、エラー検出システムは：');
    console.log('1. エラーの頻度を集計（同じエラーが3回発生など）');
    console.log('2. エラーの発生箇所を特定');
    console.log('3. 修正案を自動提案');
    console.log('4. 既知の無害なエラーは自動フィルタリング');
    console.log('\nテスト実行時にこれらのエラーが検出されると、テストは失敗扱いになります。');
    
    process.exit(0);
}, 100);