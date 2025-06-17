/**
 * 軽量JavaScript実行テスト
 * 主要なクラスとオブジェクトの初期化をテスト
 */

const vm = require('vm');
const http = require('http');

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testJavaScriptExecution() {
    console.log('🧪 軽量JavaScript実行テスト開始...');
    
    try {
        // 1. 基本的なVM環境を構築
        const context = {
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            performance: { now: () => Date.now() },
            
            // DOM最小限のmock
            document: {
                addEventListener: () => {},
                getElementById: () => ({ style: {} }),
                querySelectorAll: () => [],
                createElement: () => ({ style: {}, addEventListener: () => {} })
            },
            
            window: {},
            
            // localStorage mock
            localStorage: {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {}
            },
            
            // fetch mock
            fetch: async (url) => {
                if (url.startsWith('levels/')) {
                    const content = await httpGet(`http://localhost:8080/${url}`);
                    return {
                        ok: true,
                        json: () => Promise.resolve(JSON.parse(content))
                    };
                }
                throw new Error(`Fetch not supported: ${url}`);
            }
        };
        
        // window参照を設定
        context.window = context;
        context.global = context;
        
        vm.createContext(context);
        
        const results = {
            config: false,
            levelLoader: false,
            game: false,
            gameInitialization: false,
            errors: []
        };
        
        // 2. config.jsを実行
        console.log('📜 config.js実行中...');
        try {
            const configJs = await httpGet('http://localhost:8080/src/config.js');
            vm.runInContext(configJs, context);
            results.config = !!(context.CANVAS_WIDTH && context.CANVAS_HEIGHT);
            console.log(`  config.js: ${results.config ? '✅' : '❌'}`);
        } catch (error) {
            results.errors.push(`config.js: ${error.message}`);
            console.log(`  config.js: ❌ ${error.message}`);
        }
        
        // 3. levels.jsを実行
        console.log('📜 levels.js実行中...');
        try {
            const levelsJs = await httpGet('http://localhost:8080/src/levels.js');
            vm.runInContext(levelsJs, context);
            console.log(`  levels.js: ✅`);
        } catch (error) {
            results.errors.push(`levels.js: ${error.message}`);
            console.log(`  levels.js: ❌ ${error.message}`);
        }
        
        // 4. level-loader.jsを実行
        console.log('📜 level-loader.js実行中...');
        try {
            const levelLoaderJs = await httpGet('http://localhost:8080/src/level-loader.js');
            vm.runInContext(levelLoaderJs, context);
            results.levelLoader = !!(context.LevelLoader);
            console.log(`  level-loader.js: ${results.levelLoader ? '✅' : '❌'}`);
        } catch (error) {
            results.errors.push(`level-loader.js: ${error.message}`);
            console.log(`  level-loader.js: ❌ ${error.message}`);
        }
        
        // 5. 必要な依存関係を読み込み
        const dependencies = [
            'src/music.js',
            'src/player-graphics.js', 
            'src/svg-renderer.js',
            'src/svg-player-renderer.js',
            'src/svg-enemy-renderer.js',
            'src/svg-item-renderer.js'
        ];
        
        for (const dep of dependencies) {
            try {
                const content = await httpGet(`http://localhost:8080/${dep}`);
                vm.runInContext(content, context);
                console.log(`  ${dep}: ✅`);
            } catch (error) {
                results.errors.push(`${dep}: ${error.message}`);
                console.log(`  ${dep}: ❌ ${error.message}`);
            }
        }
        
        // 6. game.jsを実行（Gameクラス定義まで）
        console.log('📜 game.js実行中...');
        try {
            let gameJs = await httpGet('http://localhost:8080/src/game.js');
            
            // DOMContentLoadedイベントハンドラを除去してクラス定義のみ実行
            gameJs = gameJs.replace(/document\.addEventListener\('DOMContentLoaded'[\s\S]*$/, '');
            
            vm.runInContext(gameJs, context);
            results.game = !!(context.Game || context.global?.Game);
            
            // デバッグ: 利用可能なクラスを確認
            const availableClasses = [];
            if (context.GameState) availableClasses.push('GameState');
            if (context.Player) availableClasses.push('Player'); 
            if (context.InputManager) availableClasses.push('InputManager');
            if (context.Game) availableClasses.push('Game');
            
            console.log(`  利用可能なクラス: ${availableClasses.join(', ')}`);
            console.log(`  game.js: ${results.game ? '✅' : '❌'}`);
        } catch (error) {
            results.errors.push(`game.js: ${error.message}`);
            console.log(`  game.js: ❌ ${error.message}`);
        }
        
        // 7. Gameクラスのインスタンス化テスト
        console.log('🎮 Game初期化テスト...');
        try {
            if (context.Game && context.LevelLoader) {
                // Canvas mock
                context.document.getElementById = (id) => {
                    if (id === 'gameCanvas') {
                        return {
                            getContext: () => ({
                                save: () => {},
                                restore: () => {},
                                translate: () => {},
                                scale: () => {},
                                fillRect: () => {},
                                beginPath: () => {},
                                fill: () => {}
                            }),
                            width: 1024,
                            height: 576,
                            style: {}
                        };
                    }
                    return { style: {} };
                };
                
                const gameInstance = vm.runInContext('new Game()', context);
                results.gameInitialization = !!(gameInstance);
                console.log(`  Game初期化: ${results.gameInitialization ? '✅' : '❌'}`);
            } else {
                results.gameInitialization = false;
                console.log(`  Game初期化: ❌ (前提条件不足)`);
            }
        } catch (error) {
            results.errors.push(`Game初期化: ${error.message}`);
            console.log(`  Game初期化: ❌ ${error.message}`);
        }
        
        // 8. 結果サマリー
        const successCount = Object.values(results).filter(v => v === true).length;
        const totalTests = 4; // config, levelLoader, game, gameInitialization
        
        console.log('\n📊 JavaScript実行テスト結果:');
        console.log('=====================================');
        console.log(`config.js読み込み: ${results.config ? '✅' : '❌'}`);
        console.log(`LevelLoaderクラス: ${results.levelLoader ? '✅' : '❌'}`);
        console.log(`Gameクラス: ${results.game ? '✅' : '❌'}`);
        console.log(`Game初期化: ${results.gameInitialization ? '✅' : '❌'}`);
        console.log('=====================================');
        console.log(`成功率: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
        
        if (results.errors.length > 0) {
            console.log('\n❌ エラー詳細:');
            results.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        const overallSuccess = results.config && results.levelLoader && results.game && results.gameInitialization;
        
        if (overallSuccess) {
            console.log('\n🎉 基本的なJavaScript実行は正常です');
        } else {
            console.log('\n⚠️ JavaScript実行に問題があります');
        }
        
        return {
            success: overallSuccess,
            results: results,
            successRate: Math.round(successCount/totalTests*100)
        };
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        return { success: false, error: error.message };
    }
}

// 直接実行された場合
if (require.main === module) {
    testJavaScriptExecution()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { testJavaScriptExecution };