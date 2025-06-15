#!/usr/bin/env node

/**
 * 詳細テスト実行・問題特定スクリプト
 * 修正版テストページを使用して具体的な問題を特定
 */

const http = require('http');

// HTTPサーバーチェック
async function checkServer(port = 8080) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// ページの読み込みと解析
async function fetchPageContent(url, waitTime = 10000) {
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

// テスト結果の詳細解析
function analyzeTestResults(html) {
    const analysis = {
        status: 'unknown',
        summary: '',
        details: [],
        problems: [],
        recommendations: []
    };
    
    try {
        // 全体的な状態チェック
        if (html.includes('テストを初期化中...')) {
            analysis.status = 'initializing';
            analysis.summary = 'テストが初期化段階で停止している';
            analysis.problems.push('JavaScriptの実行が開始されていない');
            analysis.recommendations.push('スクリプトの読み込み順序を確認');
        } else if (html.includes('読み込みタイムアウト')) {
            analysis.status = 'timeout';
            analysis.summary = 'スクリプト読み込みがタイムアウト';
            
            // 個別の読み込み状態をチェック
            if (html.includes('CANVAS_WIDTH: undefined')) {
                analysis.problems.push('config.jsが読み込まれていない');
            }
            if (html.includes('levelData: undefined')) {
                analysis.problems.push('levels.jsが読み込まれていない');
            }
            if (html.includes('GameState: undefined')) {
                analysis.problems.push('game.jsが読み込まれていない');
            }
            
            analysis.recommendations.push('script タグの順序とパスを確認');
            analysis.recommendations.push('HTTPサーバーでのファイルアクセス可能性を確認');
        } else if (html.includes('overall-summary test-pass')) {
            analysis.status = 'success';
            analysis.summary = '全テスト成功';
        } else if (html.includes('overall-summary test-fail')) {
            analysis.status = 'failed';
            analysis.summary = 'テスト失敗あり';
            
            // 失敗したテストの詳細を抽出
            const failureRegex = /<div class="test-item test-fail">✗ ([^<]+)<\/div>/g;
            let match;
            while ((match = failureRegex.exec(html)) !== null) {
                analysis.details.push(`失敗: ${match[1]}`);
            }
            
            // 失敗の種類に基づく問題特定
            const failures = analysis.details.join(' ');
            if (failures.includes('CANVAS_WIDTH')) {
                analysis.problems.push('設定ファイル(config.js)の読み込み問題');
            }
            if (failures.includes('levelData')) {
                analysis.problems.push('レベルデータ(levels.js)の読み込み問題');
            }
            if (failures.includes('GameState') || failures.includes('Player')) {
                analysis.problems.push('ゲームクラス(game.js)の読み込み問題');
            }
            if (failures.includes('ジャンプ')) {
                analysis.problems.push('ジャンプ機能の設定値問題');
                analysis.recommendations.push('PLAYER_CONFIG.jumpPowerの値を確認');
            }
        } else {
            analysis.status = 'unknown';
            analysis.summary = 'テスト状態が判定できない';
            analysis.problems.push('HTMLの解析でテスト結果を特定できない');
        }
        
    } catch (error) {
        analysis.status = 'error';
        analysis.summary = `解析エラー: ${error.message}`;
        analysis.problems.push('HTML解析処理でエラーが発生');
    }
    
    return analysis;
}

// ファイル読み込み状況の確認
async function checkFileAccess() {
    const files = [
        '/src/config.js',
        '/src/levels.js', 
        '/src/game.js',
        '/src/music.js',
        '/src/player-graphics.js',
        '/src/svg-renderer.js'
    ];
    
    const results = {};
    
    for (const file of files) {
        try {
            const response = await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:8080${file}`, (res) => {
                    resolve({
                        status: res.statusCode,
                        accessible: res.statusCode === 200
                    });
                });
                req.on('error', () => resolve({ status: 'error', accessible: false }));
                req.setTimeout(3000, () => {
                    req.destroy();
                    resolve({ status: 'timeout', accessible: false });
                });
            });
            results[file] = response;
        } catch (error) {
            results[file] = { status: 'error', accessible: false, error: error.message };
        }
    }
    
    return results;
}

// メイン実行
async function runDetailedTests() {
    console.log('🔍 詳細テスト実行・問題特定開始...\n');
    
    // サーバーチェック
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error('❌ HTTPサーバーが起動していません');
        console.error('以下のコマンドでサーバーを起動してください:');
        console.error('python3 -m http.server 8080');
        process.exit(1);
    }
    console.log('✅ HTTPサーバー確認完了');
    
    // ファイルアクセス確認
    console.log('\\n📁 ファイルアクセス確認中...');
    const fileAccess = await checkFileAccess();
    
    let fileIssues = false;
    for (const [file, result] of Object.entries(fileAccess)) {
        const icon = result.accessible ? '✅' : '❌';
        console.log(`${icon} ${file}: ${result.status}`);
        if (!result.accessible) fileIssues = true;
    }
    
    if (fileIssues) {
        console.log('\\n⚠️  ファイルアクセスに問題があります。これがテスト失敗の原因の可能性があります。');
    }
    
    // 修正版テストページの実行
    console.log('\\n🧪 修正版テスト実行中...');
    console.log('   テストページ: http://localhost:8080/tests/fixed-test.html');
    
    try {
        const testHtml = await fetchPageContent('http://localhost:8080/tests/fixed-test.html', 12000);
        const analysis = analyzeTestResults(testHtml);
        
        console.log('\\n📊 テスト結果解析:');
        console.log('=====================================');
        
        const statusIcon = {
            'success': '🎉',
            'failed': '❌',
            'timeout': '⏱️',
            'initializing': '⏳',
            'unknown': '❓',
            'error': '💥'
        }[analysis.status] || '❓';
        
        console.log(`${statusIcon} ステータス: ${analysis.status}`);
        console.log(`📝 概要: ${analysis.summary}`);
        
        if (analysis.details.length > 0) {
            console.log('\\n📋 詳細:');
            analysis.details.forEach(detail => console.log(`   • ${detail}`));
        }
        
        if (analysis.problems.length > 0) {
            console.log('\\n🔍 特定された問題:');
            analysis.problems.forEach(problem => console.log(`   ❌ ${problem}`));
        }
        
        if (analysis.recommendations.length > 0) {
            console.log('\\n💡 推奨対応:');
            analysis.recommendations.forEach(rec => console.log(`   🔧 ${rec}`));
        }
        
        console.log('\\n=====================================');
        
        // 具体的な修正案の提示
        if (analysis.status !== 'success') {
            console.log('\\n🛠️  具体的修正案:');
            
            if (fileIssues) {
                console.log('1. ファイルパス確認:');
                console.log('   - src/フォルダ内のファイルが正しく配置されているか確認');
                console.log('   - HTTPサーバーのルートディレクトリが正しいか確認');
            }
            
            if (analysis.problems.some(p => p.includes('config.js'))) {
                console.log('2. config.js問題:');
                console.log('   - CANVAS_WIDTH, PLAYER_CONFIG等の定義を確認');
                console.log('   - JavaScriptの構文エラーを確認');
            }
            
            if (analysis.problems.some(p => p.includes('game.js'))) {
                console.log('3. game.js問題:');
                console.log('   - GameState, Player等のクラス定義を確認');
                console.log('   - 依存関係の読み込み順序を確認');
            }
            
            if (analysis.problems.some(p => p.includes('ジャンプ'))) {
                console.log('4. ジャンプ機能問題:');
                console.log('   - PLAYER_CONFIG.jumpPowerの値を調整');
                console.log('   - テスト条件を設定値に合わせて修正');
            }
            
            console.log('\\n5. 緊急対応:');
            console.log('   - ブラウザで直接テストページを確認: http://localhost:8080/tests/fixed-test.html');
            console.log('   - ブラウザのDevToolsでコンソールエラーを確認');
            console.log('   - 必要に応じてハードリフレッシュ (Ctrl+F5)');
            
            process.exit(1);
        } else {
            console.log('\\n🎉 テストは正常に完了しています！');
        }
        
    } catch (error) {
        console.error(`💥 テスト実行エラー: ${error.message}`);
        console.error('\\n🔧 トラブルシューティング:');
        console.error('1. HTTPサーバーが正常に動作しているか確認');
        console.error('2. ポート8080が他のプロセスで使用されていないか確認');
        console.error('3. ファイアウォールがアクセスをブロックしていないか確認');
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    runDetailedTests().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runDetailedTests };