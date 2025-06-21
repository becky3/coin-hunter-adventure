#!/usr/bin/env node

/**
 * 自動テスト実行スクリプト
 * Claudeが自動的にゲームテストを実行
 */

const fs = require('fs');
const path = require('path');

// JSDOM環境のセットアップ
const { JSDOM } = require('jsdom');

// テスト環境の初期化
function setupTestEnvironment() {
    const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="gameCanvas"></canvas></body></html>', {
        url: 'http://localhost:8080/',
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously'
    });

    // グローバル変数の設定
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
    global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
    global.cancelAnimationFrame = clearTimeout;

    // Canvas 2Dコンテキストのモック
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 必要なメソッドのモック
    if (!ctx.roundRect) {
        ctx.roundRect = function() {};
    }

    return { dom, canvas, ctx };
}

// テストの実行
async function runTests() {
    console.log('🚀 自動ゲームテストを開始します...\n');
    
    try {
        // 環境セットアップ
        const { dom, canvas, ctx } = setupTestEnvironment();
        
        // 必要なモジュールの読み込み
        const GameStateManager = require('../src/game-state-manager.js');
        const AutomatedTestPlayer = require('../src/automated-test-player.js');
        const AutomatedGameTests = require('../tests/automated-game-tests.js');
        
        // グローバルに設定
        global.GameStateManager = GameStateManager;
        global.AutomatedTestPlayer = AutomatedTestPlayer;
        
        // テストランナーの作成
        const tester = new AutomatedGameTests();
        
        // 全テストの実行
        const results = await tester.runAllTests();
        
        // 結果の保存
        const outputPath = path.join(__dirname, '..', 'test-results', 'automated-test-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 テスト結果を保存しました: ${outputPath}`);
        
        // サマリーの表示
        console.log('\n📊 テスト結果サマリー');
        console.log('─'.repeat(40));
        console.log(`総テスト数: ${results.summary.total}`);
        console.log(`成功: ${results.summary.passed}`);
        console.log(`失敗: ${results.summary.failed}`);
        console.log(`成功率: ${results.summary.successRate}`);
        console.log(`実行時間: ${results.summary.duration}`);
        
        // 詳細結果の表示（失敗したテストのみ）
        const failedTests = results.details.filter(t => !t.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ 失敗したテスト:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }
        
        // 終了コード
        process.exit(results.summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ テスト実行中にエラーが発生しました:', error);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    runTests();
}

module.exports = { runTests };