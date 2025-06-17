/**
 * 基本的なHTTPとJavaScript検証
 */
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function checkGameState() {
    try {
        console.log('🔍 HTTPサーバーとページ基本チェック開始');
        
        // 1. HTTPサーバー確認
        console.log('\n📡 HTTPサーバー確認');
        try {
            const indexHtml = await fetchPage('http://localhost:8080/');
            console.log('✅ index.html アクセス可能');
            console.log(`   サイズ: ${indexHtml.length} bytes`);
        } catch (error) {
            console.log('❌ HTTPサーバー未起動 - python3 -m http.server 8080 を実行してください');
            return;
        }
        
        // 2. check-game.html確認
        console.log('\n🧪 check-game.html確認');
        try {
            const checkHtml = await fetchPage('http://localhost:8080/check-game.html');
            console.log('✅ check-game.html アクセス可能');
            console.log(`   サイズ: ${checkHtml.length} bytes`);
        } catch (error) {
            console.log('❌ check-game.html アクセスエラー:', error.message);
        }
        
        // 3. 必須スクリプトファイル確認
        console.log('\n📁 必須スクリプトファイル確認');
        const requiredScripts = [
            'src/config.js',
            'src/game.js', 
            'src/level-loader.js',
            'src/levels.js'
        ];
        
        for (const script of requiredScripts) {
            try {
                const content = await fetchPage(`http://localhost:8080/${script}`);
                console.log(`✅ ${script} (${content.length} bytes)`);
            } catch (error) {
                console.log(`❌ ${script} 読み込み失敗:`, error.message);
            }
        }
        
        // 4. JSONファイル確認
        console.log('\n📋 JSONファイル確認');
        const jsonFiles = [
            'levels/stages.json',
            'levels/stage1.json'
        ];
        
        for (const file of jsonFiles) {
            try {
                const content = await fetchPage(`http://localhost:8080/${file}`);
                JSON.parse(content); // JSON検証
                console.log(`✅ ${file} (有効なJSON)`);
            } catch (error) {
                console.log(`❌ ${file} エラー:`, error.message);
            }
        }
        
        // 5. JSDOM環境でのJavaScript基本テスト
        console.log('\n🔬 JavaScript基本動作テスト');
        
        try {
            // index.htmlを読み込み
            const indexHtml = await fetchPage('http://localhost:8080/');
            
            const dom = new JSDOM(indexHtml, {
                url: 'http://localhost:8080/',
                runScripts: 'dangerously',
                resources: 'usable',
                beforeParse: (window) => {
                    // 最小限のブラウザAPI提供
                    window.fetch = async (url) => {
                        const content = await fetchPage(`http://localhost:8080/${url}`);
                        return {
                            ok: true,
                            json: () => Promise.resolve(JSON.parse(content)),
                            text: () => Promise.resolve(content)
                        };
                    };
                    
                    window.localStorage = {
                        data: {},
                        getItem: function(key) { return this.data[key] || null; },
                        setItem: function(key, value) { this.data[key] = String(value); },
                        removeItem: function(key) { delete this.data[key]; },
                        clear: function() { this.data = {}; }
                    };
                }
            });
            
            // DOMContentLoadedイベントをシミュレート
            await new Promise(resolve => {
                setTimeout(() => {
                    const event = new dom.window.Event('DOMContentLoaded');
                    dom.window.document.dispatchEvent(event);
                    resolve();
                }, 1000);
            });
            
            // 3秒待機して初期化を待つ
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // ゲーム状態確認
            const gameState = {
                gameExists: typeof dom.window.game !== 'undefined',
                gameType: typeof dom.window.game,
                gameInitError: dom.window.gameInitError?.message,
                configExists: typeof dom.window.config !== 'undefined',
                gameClassExists: typeof dom.window.Game !== 'undefined'
            };
            
            console.log('📊 JavaScript実行結果:');
            console.log(`   window.game存在: ${gameState.gameExists}`);
            console.log(`   window.gameタイプ: ${gameState.gameType}`);
            console.log(`   configオブジェクト: ${gameState.configExists}`);
            console.log(`   Gameクラス: ${gameState.gameClassExists}`);
            
            if (gameState.gameInitError) {
                console.log(`   ❌ 初期化エラー: ${gameState.gameInitError}`);
                return { success: false, error: gameState.gameInitError };
            }
            
            if (gameState.gameExists) {
                console.log('✅ ゲーム初期化成功の可能性が高い');
                return { success: true, gameState };
            } else {
                console.log('⚠️  ゲームオブジェクトが作成されていない');
                return { success: false, error: 'ゲームオブジェクト未作成' };
            }
            
        } catch (error) {
            console.log('❌ JavaScript実行テストエラー:', error.message);
            return { success: false, error: error.message };
        }
        
    } catch (error) {
        console.log('❌ 全体テストエラー:', error.message);
        return { success: false, error: error.message };
    }
}

// テスト実行
if (require.main === module) {
    checkGameState().then(result => {
        console.log('\n🏁 基本チェック完了');
        if (result) {
            console.log(`結果: ${result.success ? '✅ 基本的な問題なし' : '❌ 問題検出'}`);
            if (result.error) {
                console.log(`エラー: ${result.error}`);
            }
        }
        
        console.log('\n💡 次のステップ:');
        console.log('   1. ブラウザで http://localhost:8080/ を開いて実際の動作確認');
        console.log('   2. ブラウザで http://localhost:8080/check-game.html でエラー確認');
        console.log('   3. F12で開発者ツールを開いてJavaScriptエラー確認');
        
        process.exit(result?.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 致命的エラー:', error);
        process.exit(1);
    });
}

module.exports = { checkGameState };