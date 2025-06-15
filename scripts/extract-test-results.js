#!/usr/bin/env node

/**
 * 最小テストの結果を抽出・解析するスクリプト
 * ブラウザでレンダリングされた内容からテスト結果を読み取り
 */

const http = require('http');

async function fetchTestResults(url, waitTime = 5000) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                setTimeout(() => resolve(data), waitTime);
            });
        });
        req.on('error', reject);
    });
}

function extractLogs(html) {
    const results = {
        success: [],
        errors: [],
        warnings: [],
        info: []
    };
    
    // ログ行の抽出パターン
    const logPatterns = [
        />\[([^\]]+)\] (✅[^<]+)/g,
        />\[([^\]]+)\] (❌[^<]+)/g,
        />\[([^\]]+)\] (⚠️[^<]+)/g,
        />\[([^\]]+)\] (🧪[^<]+)/g,
        />\[([^\]]+)\] (📁[^<]+)/g,
        />\[([^\]]+)\] (🎉[^<]+)/g,
        />\[([^\]]+)\] (🏁[^<]+)/g
    ];
    
    for (const pattern of logPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const [, timestamp, message] = match;
            const cleanMessage = message.trim();
            
            if (cleanMessage.startsWith('✅')) {
                results.success.push({ timestamp, message: cleanMessage });
            } else if (cleanMessage.startsWith('❌')) {
                results.errors.push({ timestamp, message: cleanMessage });
            } else if (cleanMessage.startsWith('⚠️')) {
                results.warnings.push({ timestamp, message: cleanMessage });
            } else {
                results.info.push({ timestamp, message: cleanMessage });
            }
        }
    }
    
    return results;
}

async function analyzeMinimalTest() {
    console.log('🔍 最小テスト結果解析開始...\n');
    
    try {
        const html = await fetchTestResults('http://localhost:8080/tests/minimal-test.html', 6000);
        const logs = extractLogs(html);
        
        console.log('📊 テスト結果解析:');
        console.log('=====================================');
        
        // 成功項目
        console.log(`✅ 成功: ${logs.success.length}件`);
        if (logs.success.length > 0) {
            logs.success.forEach(log => {
                console.log(`   ${log.message}`);
            });
        }
        
        // エラー項目
        console.log(`\n❌ エラー: ${logs.errors.length}件`);
        if (logs.errors.length > 0) {
            logs.errors.forEach(log => {
                console.log(`   ${log.message}`);
            });
        }
        
        // 警告項目
        console.log(`\n⚠️  警告: ${logs.warnings.length}件`);
        if (logs.warnings.length > 0) {
            logs.warnings.forEach(log => {
                console.log(`   ${log.message}`);
            });
        }
        
        // その他の情報
        console.log(`\n📋 情報: ${logs.info.length}件`);
        if (logs.info.length > 0) {
            logs.info.forEach(log => {
                console.log(`   ${log.message}`);
            });
        }
        
        console.log('\n=====================================');
        
        // 問題分析
        const problems = [];
        const solutions = [];
        
        // 設定関連の問題
        if (logs.errors.some(log => log.message.includes('CANVAS_WIDTH'))) {
            problems.push('config.js: CANVAS_WIDTH定義の問題');
            solutions.push('src/config.js の CANVAS_WIDTH = 1024; の記述を確認');
        }
        if (logs.errors.some(log => log.message.includes('PLAYER_CONFIG'))) {
            problems.push('config.js: PLAYER_CONFIG定義の問題');
            solutions.push('src/config.js の PLAYER_CONFIG オブジェクト定義を確認');
        }
        
        // レベルデータの問題
        if (logs.errors.some(log => log.message.includes('levelData'))) {
            problems.push('levels.js: levelData定義の問題');
            solutions.push('src/levels.js の levelData オブジェクト定義を確認');
        }
        
        // クラス定義の問題
        const classErrors = logs.errors.filter(log => 
            log.message.includes('GameState') || 
            log.message.includes('Player') || 
            log.message.includes('InputManager')
        );
        if (classErrors.length > 0) {
            problems.push('game.js: ゲームクラス定義の問題');
            solutions.push('src/game.js のクラス定義とexport処理を確認');
        }
        
        // SVGレンダラーの問題
        if (logs.errors.some(log => log.message.includes('SVGPlayerRenderer'))) {
            problems.push('SVGレンダラー: クラス定義の問題');
            solutions.push('src/svg-player-renderer.js の読み込みとクラス定義を確認');
        }
        
        // ジャンプ機能の問題
        if (logs.warnings.some(log => log.message.includes('ジャンプテスト'))) {
            problems.push('ジャンプ機能: 速度値が期待値と異なる');
            solutions.push('PLAYER_CONFIG.jumpPower の値を調整、またはテスト条件を見直し');
        }
        
        if (problems.length > 0) {
            console.log('\n🔍 特定された問題:');
            problems.forEach((problem, index) => {
                console.log(`${index + 1}. ${problem}`);
            });
            
            console.log('\n🛠️ 推奨解決策:');
            solutions.forEach((solution, index) => {
                console.log(`${index + 1}. ${solution}`);
            });
            
            // 具体的な確認コマンド
            console.log('\n🔧 確認コマンド:');
            console.log('curl -s http://localhost:8080/src/config.js | head -10');
            console.log('curl -s http://localhost:8080/src/levels.js | head -10');
            console.log('curl -s http://localhost:8080/src/game.js | head -20');
            
            if (logs.errors.length > 0) {
                console.log('\n❌ 重要なエラーが検出されました。修正が必要です。');
                process.exit(1);
            }
        } else {
            console.log('\n🎉 基本機能は正常に動作しています！');
            console.log('元のテストが失敗する原因は他にある可能性があります。');
        }
        
    } catch (error) {
        console.error(`💥 解析エラー: ${error.message}`);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    analyzeMinimalTest().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { analyzeMinimalTest };