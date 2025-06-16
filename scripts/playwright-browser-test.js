/**
 * Playwrightを使用した実際のブラウザでのゲーム動作テスト
 */
const { chromium } = require('playwright');

async function testWithPlaywright() {
    let browser;
    try {
        console.log('🚀 Playwright実ブラウザテスト開始');
        
        // ブラウザを起動
        browser = await chromium.launch({
            headless: false, // ブラウザを表示
            devtools: true   // 開発者ツールを開く
        });
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // コンソールログをキャプチャ
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            const text = `[${msg.type()}] ${msg.text()}`;
            logs.push(text);
            console.log('📝 Browser:', text);
        });
        
        page.on('pageerror', error => {
            const errorText = `❌ Page Error: ${error.message}`;
            errors.push(errorText);
            console.log(errorText);
        });
        
        // HTTPサーバーが動いているか確認
        try {
            console.log('🔍 HTTPサーバー確認中...');
            await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 5000 });
            console.log('✅ HTTPサーバー動作確認');
        } catch (error) {
            console.log('❌ HTTPサーバーが動いていません');
            console.log('   解決方法: python3 -m http.server 8080 を実行してください');
            return { success: false, error: 'HTTPサーバー未起動' };
        }
        
        console.log('\n🎮 メインゲーム (index.html) テスト');
        console.log('=====================================');
        
        // メインゲームページをテスト
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
        
        // 5秒待機してJavaScript実行を待つ
        await page.waitForTimeout(5000);
        
        // window.gameの存在確認
        const gameResult = await page.evaluate(() => {
            return {
                gameExists: typeof window.game !== 'undefined',
                gameType: typeof window.game,
                isInitialized: window.game?.isInitialized || false,
                gameInitError: window.gameInitError ? window.gameInitError.message : null,
                gameState: window.game?.gameState?.state || 'unknown'
            };
        });
        
        console.log('📊 メインゲーム結果:');
        console.log(`   window.game存在: ${gameResult.gameExists}`);
        console.log(`   window.gameタイプ: ${gameResult.gameType}`);
        console.log(`   初期化完了: ${gameResult.isInitialized}`);
        console.log(`   ゲーム状態: ${gameResult.gameState}`);
        if (gameResult.gameInitError) {
            console.log(`   ❌ 初期化エラー: ${gameResult.gameInitError}`);
        }
        
        console.log('\n🧪 check-game.html テスト');
        console.log('=====================================');
        
        // check-game.htmlをテスト
        await page.goto('http://localhost:8080/check-game.html', { waitUntil: 'networkidle' });
        
        // 3秒待機してテスト完了を待つ
        await page.waitForTimeout(3000);
        
        // テスト結果を取得
        const checkResult = await page.evaluate(() => {
            const status = document.getElementById('status');
            const logs = Array.from(document.querySelectorAll('.log')).map(el => ({
                type: el.className.replace('log ', ''),
                text: el.textContent
            }));
            
            return {
                status: status ? status.textContent : 'Status not found',
                testGame: typeof window.testGame !== 'undefined',
                logs: logs.slice(-10) // 最新10件
            };
        });
        
        console.log('📊 check-game.html結果:');
        console.log(`   ステータス: ${checkResult.status}`);
        console.log(`   testGame存在: ${checkResult.testGame}`);
        
        console.log('\n📝 check-game.htmlログ:');
        checkResult.logs.forEach((log) => {
            const prefix = log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : '📝';
            console.log(`   ${prefix} ${log.text}`);
        });
        
        console.log('\n🧪 test.html テスト');
        console.log('=====================================');
        
        // test.htmlをテスト
        await page.goto('http://localhost:8080/tests/test.html', { waitUntil: 'networkidle' });
        
        // 8秒待機してテスト完了を待つ
        await page.waitForTimeout(8000);
        
        // テスト結果を取得
        const testResult = await page.evaluate(() => {
            const results = document.getElementById('testResults');
            const summary = document.getElementById('testSummary');
            
            return {
                results: results ? results.innerHTML : 'Results not found',
                summary: summary ? summary.textContent : 'Summary not found',
                windowGame: typeof window.game !== 'undefined',
                gameType: typeof window.game,
                corsWarning: document.getElementById('corsWarning') ? 'CORS警告表示中' : 'CORS警告なし'
            };
        });
        
        console.log('📊 test.html結果:');
        console.log(`   window.game存在: ${testResult.windowGame}`);
        console.log(`   window.gameタイプ: ${testResult.gameType}`);
        console.log(`   CORS状況: ${testResult.corsWarning}`);
        console.log(`   テストサマリー: ${testResult.summary}`);
        
        // テスト結果の詳細を表示
        if (testResult.results && testResult.results !== 'Results not found') {
            console.log('\n📋 詳細テスト結果:');
            const cleanResults = testResult.results.replace(/<[^>]*>/g, '').trim();
            if (cleanResults) {
                console.log(`   ${cleanResults}`);
            }
        }
        
        console.log('\n📊 全体サマリー');
        console.log('=====================================');
        console.log(`📝 収集したログ数: ${logs.length}`);
        console.log(`❌ エラー数: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 発生したエラー:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // 成功判定
        const isSuccess = errors.length === 0 && 
                         gameResult.gameExists && 
                         !gameResult.gameInitError &&
                         checkResult.status.includes('成功');
        
        console.log(`\n🎯 総合判定: ${isSuccess ? '✅ 成功' : '❌ 失敗'}`);
        
        // ブラウザを3秒間開いたままにして確認可能にする
        console.log('\n🖥️  ブラウザを3秒間開いたままにします...');
        await page.waitForTimeout(3000);
        
        return {
            success: isSuccess,
            logs,
            errors,
            results: {
                mainGame: gameResult,
                checkGame: checkResult,
                testPage: testResult
            }
        };
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        return {
            success: false,
            error: error.message,
            logs: [],
            errors: [error.message]
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// テスト実行
if (require.main === module) {
    testWithPlaywright().then(result => {
        console.log(`\n🏁 最終結果: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
        
        if (!result.success) {
            console.log('\n💡 問題が検出されました。修正が必要です。');
        }
        
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { testWithPlaywright };