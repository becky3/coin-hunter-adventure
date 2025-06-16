/**
 * 実際のブラウザでのゲーム動作テスト
 */
const puppeteer = require('puppeteer');

async function testRealBrowser() {
    let browser;
    try {
        console.log('🚀 実際のブラウザテスト開始');
        
        // ブラウザを起動
        browser = await puppeteer.launch({
            headless: false, // ブラウザを表示
            devtools: true,  // 開発者ツールを開く
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
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
            await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 5000 });
            console.log('✅ HTTPサーバー動作確認');
        } catch (error) {
            console.log('❌ HTTPサーバーが動いていません。python3 -m http.server 8080 を実行してください');
            return;
        }
        
        console.log('\n🎮 メインゲーム (index.html) テスト');
        console.log('=====================================');
        
        // メインゲームページをテスト
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
        
        // 5秒待機してJavaScript実行を待つ
        await page.waitForTimeout(5000);
        
        // window.gameの存在確認
        const gameExists = await page.evaluate(() => {
            return {
                gameExists: typeof window.game !== 'undefined',
                gameType: typeof window.game,
                isInitialized: window.game?.isInitialized || false,
                gameInitError: window.gameInitError ? window.gameInitError.message : null
            };
        });
        
        console.log('📊 メインゲーム結果:');
        console.log(`   window.game存在: ${gameExists.gameExists}`);
        console.log(`   window.gameタイプ: ${gameExists.gameType}`);
        console.log(`   初期化完了: ${gameExists.isInitialized}`);
        if (gameExists.gameInitError) {
            console.log(`   初期化エラー: ${gameExists.gameInitError}`);
        }
        
        console.log('\n🧪 check-game.html テスト');
        console.log('=====================================');
        
        // check-game.htmlをテスト
        await page.goto('http://localhost:8080/check-game.html', { waitUntil: 'networkidle0' });
        
        // 5秒待機してテスト完了を待つ
        await page.waitForTimeout(5000);
        
        // テスト結果を取得
        const checkGameResult = await page.evaluate(() => {
            const status = document.getElementById('status');
            const logs = Array.from(document.querySelectorAll('.log')).map(el => ({
                type: el.className.replace('log ', ''),
                text: el.textContent
            }));
            
            return {
                status: status ? status.textContent : 'Status not found',
                testGame: typeof window.testGame !== 'undefined',
                logs: logs
            };
        });
        
        console.log('📊 check-game.html結果:');
        console.log(`   ステータス: ${checkGameResult.status}`);
        console.log(`   testGame存在: ${checkGameResult.testGame}`);
        
        console.log('\n📝 check-game.htmlログ:');
        checkGameResult.logs.forEach((log, index) => {
            const prefix = log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : '📝';
            console.log(`   ${prefix} ${log.text}`);
        });
        
        console.log('\n🧪 test.html テスト');
        console.log('=====================================');
        
        // test.htmlをテスト
        await page.goto('http://localhost:8080/tests/test.html', { waitUntil: 'networkidle0' });
        
        // 10秒待機してテスト完了を待つ
        await page.waitForTimeout(10000);
        
        // テスト結果を取得
        const testResult = await page.evaluate(() => {
            const results = document.getElementById('testResults');
            const summary = document.getElementById('testSummary');
            
            return {
                results: results ? results.textContent : 'Results not found',
                summary: summary ? summary.textContent : 'Summary not found',
                windowGame: typeof window.game !== 'undefined',
                gameType: typeof window.game
            };
        });
        
        console.log('📊 test.html結果:');
        console.log(`   window.game存在: ${testResult.windowGame}`);
        console.log(`   window.gameタイプ: ${testResult.gameType}`);
        console.log(`   テスト結果: ${testResult.results}`);
        console.log(`   テストサマリー: ${testResult.summary}`);
        
        console.log('\n📊 全体サマリー');
        console.log('=====================================');
        console.log(`✅ 収集したログ数: ${logs.length}`);
        console.log(`❌ エラー数: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 発生したエラー:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // ブラウザを5秒間開いたままにして確認可能にする
        console.log('\n🖥️  ブラウザを5秒間開いたままにします...');
        await page.waitForTimeout(5000);
        
        return {
            success: errors.length === 0 && gameExists.gameExists,
            logs,
            errors,
            results: {
                mainGame: gameExists,
                checkGame: checkGameResult,
                testPage: testResult
            }
        };
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
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
    testRealBrowser().then(result => {
        console.log(`\n🏁 テスト完了: ${result.success ? '成功' : '失敗'}`);
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { testRealBrowser };