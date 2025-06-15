#!/usr/bin/env node

/**
 * 自動テスト実行・結果解析スクリプト
 * ブラウザでテストを実行し、結果を詳細に解析してコンソールに出力
 */

const http = require('http');
const { JSDOM } = require('jsdom');

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

// ページの完全読み込みとJavaScript実行完了を待つ
async function fetchPageWithJS(url, waitTime = 5000) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // JavaScript実行を待つ
                setTimeout(() => {
                    resolve(data);
                }, waitTime);
            });
        });
        req.on('error', reject);
    });
}

// HTMLからテスト結果を解析
function parseTestResults(html) {
    const results = {
        overall: { success: false, message: '' },
        categories: [],
        errors: [],
        warnings: []
    };
    
    try {
        // 全体結果の解析
        if (html.includes('overall-summary test-pass')) {
            results.overall.success = true;
            results.overall.message = '全テスト成功';
        } else if (html.includes('overall-summary test-fail')) {
            results.overall.success = false;
            results.overall.message = 'テスト失敗あり';
        } else if (html.includes('テストを実行中...')) {
            results.overall.success = false;
            results.overall.message = 'テスト実行中（JavaScript未完了）';
        } else {
            results.overall.success = false;
            results.overall.message = 'テスト結果不明';
        }
        
        // カテゴリ別結果の解析
        const categoryRegex = /<div class="test-category\s+([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div class="category-summary[^>]*>([^<]+)<\/div>([\s\S]*?)<\/div>\s*<\/div>/g;
        let categoryMatch;
        
        while ((categoryMatch = categoryRegex.exec(html)) !== null) {
            const [, classes, title, summary, detailsHTML] = categoryMatch;
            const isPassed = classes.includes('category-pass');
            
            // 個別テスト項目の解析
            const testItems = [];
            const testItemRegex = /<div class="test-item\s+([^"]*)"[^>]*>([^<]+)<\/div>/g;
            let itemMatch;
            
            while ((itemMatch = testItemRegex.exec(detailsHTML)) !== null) {
                const [, itemClasses, itemText] = itemMatch;
                const itemPassed = itemClasses.includes('test-pass');
                testItems.push({
                    text: itemText.trim(),
                    passed: itemPassed
                });
                
                if (!itemPassed) {
                    results.errors.push(`${title}: ${itemText.trim()}`);
                }
            }
            
            results.categories.push({
                title: title.replace(/[✅❌]/g, '').trim(),
                passed: isPassed,
                summary: summary.trim(),
                tests: testItems
            });
        }
        
        // JavaScript エラーの検出
        if (html.includes('Uncaught') || html.includes('TypeError') || html.includes('ReferenceError')) {
            results.warnings.push('JavaScript実行エラーの可能性があります');
        }
        
        // 404エラーの検出
        if (html.includes('404') || html.includes('Not Found')) {
            results.warnings.push('リソース読み込みエラーの可能性があります');
        }
        
    } catch (error) {
        results.errors.push(`HTML解析エラー: ${error.message}`);
    }
    
    return results;
}

// デバッグテストページの結果解析
function parseDebugTestResults(html) {
    const results = {
        environment: {},
        testLogs: [],
        errors: []
    };
    
    try {
        // 環境情報の抽出
        const envRegex = /<p><strong>([^:]+):<\/strong>\s*<span class="([^"]*)"[^>]*>([^<]+)<\/span><\/p>/g;
        let envMatch;
        
        while ((envMatch = envRegex.exec(html)) !== null) {
            const [, key, statusClass, value] = envMatch;
            results.environment[key] = {
                value: value.trim(),
                status: statusClass.includes('status-ok') ? 'ok' : 
                       statusClass.includes('status-error') ? 'error' : 'warning'
            };
        }
        
        // テストログの抽出（実際のスクリプト実行結果は取得困難なので環境チェックに焦点）
        
    } catch (error) {
        results.errors.push(`デバッグページ解析エラー: ${error.message}`);
    }
    
    return results;
}

// メインテスト実行
async function runAutomatedTests() {
    console.log('🧪 自動テスト実行開始...\n');
    
    // サーバーチェック
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error('❌ HTTPサーバーが起動していません');
        console.error('以下のコマンドでサーバーを起動してください:');
        console.error('python3 -m http.server 8080');
        process.exit(1);
    }
    console.log('✅ HTTPサーバー確認完了');
    
    let hasErrors = false;
    
    try {
        // デバッグテストページで環境チェック
        console.log('\n🐛 デバッグテスト実行中...');
        const debugHtml = await fetchPageWithJS('http://localhost:8080/tests/debug-test.html', 3000);
        const debugResults = parseDebugTestResults(debugHtml);
        
        console.log('📊 環境チェック結果:');
        console.log('=====================================');
        for (const [key, info] of Object.entries(debugResults.environment)) {
            const icon = info.status === 'ok' ? '✅' : info.status === 'error' ? '❌' : '⚠️';
            console.log(`${icon} ${key}: ${info.value}`);
            if (info.status === 'error') hasErrors = true;
        }
        
        if (debugResults.errors.length > 0) {
            console.log('\n🔍 デバッグページエラー:');
            debugResults.errors.forEach(error => console.log(`❌ ${error}`));
            hasErrors = true;
        }
        
        // メインテストページの実行
        console.log('\n🧪 メインテスト実行中...');
        const mainHtml = await fetchPageWithJS('http://localhost:8080/tests/test.html', 8000);
        const mainResults = parseTestResults(mainHtml);
        
        console.log('\n📊 メインテスト結果:');
        console.log('=====================================');
        
        const overallIcon = mainResults.overall.success ? '🎉' : '⚠️';
        console.log(`${overallIcon} 全体結果: ${mainResults.overall.message}`);
        
        if (mainResults.categories.length === 0) {
            console.log('❌ テストカテゴリが検出されませんでした');
            console.log('   - JavaScriptの実行が完了していない可能性があります');
            console.log('   - ファイル読み込みエラーの可能性があります');
            hasErrors = true;
        } else {
            console.log(`\n📋 カテゴリ別結果 (${mainResults.categories.length}カテゴリ):`);
            
            for (const category of mainResults.categories) {
                const icon = category.passed ? '✅' : '❌';
                console.log(`\n${icon} ${category.title}`);
                console.log(`   ${category.summary}`);
                
                if (!category.passed && category.tests.length > 0) {
                    console.log('   失敗したテスト:');
                    category.tests.forEach(test => {
                        if (!test.passed) {
                            console.log(`   • ${test.text}`);
                        }
                    });
                    hasErrors = true;
                }
            }
        }
        
        // エラーと警告の表示
        if (mainResults.errors.length > 0) {
            console.log('\n🔍 検出されたエラー:');
            mainResults.errors.forEach(error => console.log(`❌ ${error}`));
            hasErrors = true;
        }
        
        if (mainResults.warnings.length > 0) {
            console.log('\n⚠️  警告:');
            mainResults.warnings.forEach(warning => console.log(`⚠️ ${warning}`));
        }
        
        console.log('\n=====================================');
        
        // 詳細確認の案内
        console.log('\n🌐 詳細確認:');
        console.log('メインテスト: http://localhost:8080/tests/test.html');
        console.log('デバッグテスト: http://localhost:8080/tests/debug-test.html');
        
        // 修正提案
        if (hasErrors) {
            console.log('\n🔧 修正提案:');
            
            // 環境エラーの場合
            if (debugResults.environment.CANVAS_WIDTH?.status === 'error') {
                console.log('• config.jsの読み込みに問題があります');
            }
            if (debugResults.environment.levelData?.status === 'error') {
                console.log('• levels.jsの読み込みに問題があります');
            }
            if (debugResults.environment.GameState?.status === 'error') {
                console.log('• game.jsの読み込みに問題があります');
            }
            
            // テスト固有のエラー
            if (mainResults.errors.some(e => e.includes('ジャンプ'))) {
                console.log('• ジャンプ機能のテストに問題があります - コンフィグ値の調整が必要');
            }
            if (mainResults.errors.some(e => e.includes('SVG'))) {
                console.log('• SVGレンダリングに問題があります - HTTPサーバー経由でアクセスしているか確認');
            }
            
            process.exit(1);
        } else {
            console.log('\n🎉 全てのテストが正常に完了しました！');
        }
        
    } catch (error) {
        console.error(`💥 テスト実行エラー: ${error.message}`);
        process.exit(1);
    }
}

// メイン実行
if (require.main === module) {
    runAutomatedTests().catch(error => {
        console.error(`💥 予期しないエラー: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runAutomatedTests };