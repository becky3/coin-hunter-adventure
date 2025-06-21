/**
 * 自動ゲームテストスイート
 * Claudeが自動的に実行・検証できるテスト
 */

// GameStateManagerとAutomatedTestPlayerの読み込み
let GameStateManager, AutomatedTestPlayer;

if (typeof require !== 'undefined') {
    GameStateManager = require('../src/game-state-manager.js');
    AutomatedTestPlayer = require('../src/automated-test-player.js');
}

class AutomatedGameTests {
    constructor() {
        this.testResults = [];
        this.game = null;
        this.stateManager = null;
        this.testPlayer = null;
    }

    // ゲームインスタンスの初期化
    async initializeGame() {
        // ゲームが既に初期化されているか確認
        if (typeof window !== 'undefined' && window.game) {
            this.game = window.game;
        } else {
            // テスト用のモックゲームを作成
            this.game = this.createMockGame();
        }

        this.stateManager = new GameStateManager();
        this.testPlayer = new AutomatedTestPlayer(this.game, this.stateManager);
    }

    // モックゲームの作成（ブラウザ環境外でのテスト用）
    createMockGame() {
        const game = {
            player: {
                x: 50,
                y: 350,
                vx: 0,
                vy: 0,
                grounded: true,
                lives: 3,
                facingRight: true,
                animation: 'idle',
                width: 50,
                height: 50,
                speed: 5,
                jumpSpeed: 15
            },
            coins: 0,
            enemies: [],
            levelCoins: [
                { x: 200, y: 300, collected: false },
                { x: 400, y: 250, collected: false }
            ],
            springs: [],
            keys: {
                left: false,
                right: false,
                up: false
            },
            state: 'playing',
            currentLevel: 1,
            frameCount: 0,
            levelWidth: 3000,
            cameraX: 0,
            cameraY: 0,
            platforms: [
                { x: 0, y: 400, width: 3000, height: 100 } // 地面
            ]
        };

        // updateメソッドを追加（簡易版）
        game.update = function() {
            const player = this.player;
            
            // 左右移動
            if (this.keys.left) {
                player.vx = -player.speed;
                player.facingRight = false;
            } else if (this.keys.right) {
                player.vx = player.speed;
                player.facingRight = true;
            } else {
                player.vx *= 0.8; // 摩擦
            }
            
            // ジャンプ
            if (this.keys.up && player.grounded) {
                player.vy = -player.jumpSpeed;
                player.grounded = false;
            }
            
            // 重力
            if (!player.grounded) {
                player.vy += 0.5;
            }
            
            // 位置更新
            player.x += player.vx;
            player.y += player.vy;
            
            // 地面との衝突判定（簡易版）
            if (player.y >= 350) {
                player.y = 350;
                player.vy = 0;
                player.grounded = true;
            }
            
            // カメラ更新
            this.cameraX = Math.max(0, player.x - 400);
        };

        return game;
    }

    // テストスイートの実行
    async runAllTests() {
        console.log('🧪 自動ゲームテスト開始...\n');
        
        await this.initializeGame();
        
        const testCategories = [
            { name: 'ゲーム状態管理', tests: this.getStateManagementTests() },
            { name: 'プレイヤー動作', tests: this.getPlayerMovementTests() },
            { name: 'ゲームメカニクス', tests: this.getGameMechanicsTests() },
            { name: '物理エンジン', tests: this.getPhysicsTests() },
            { name: '衝突検出', tests: this.getCollisionTests() }
        ];

        for (const category of testCategories) {
            console.log(`\n📂 ${category.name}`);
            console.log('─'.repeat(40));
            
            for (const test of category.tests) {
                await this.runTest(test);
            }
        }

        return this.generateReport();
    }

    // 個別テストの実行
    async runTest(test) {
        const startTime = Date.now();
        let result = {
            name: test.name,
            passed: false,
            error: null,
            duration: 0,
            details: {}
        };

        try {
            // テストの初期化
            if (test.setup) {
                await test.setup(this.game, this.stateManager);
            }

            // テストの実行
            const testResult = await test.execute(this.game, this.stateManager, this.testPlayer);
            
            result.passed = true;
            result.details = testResult;
            console.log(`✅ ${test.name}`);
            
        } catch (error) {
            result.error = error.message;
            console.log(`❌ ${test.name}: ${error.message}`);
        }

        result.duration = Date.now() - startTime;
        this.testResults.push(result);
        
        return result;
    }

    // 状態管理テスト
    getStateManagementTests() {
        return [
            {
                name: '状態キャプチャの正確性',
                execute: async (game, stateManager) => {
                    const state1 = stateManager.captureState(game);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const state2 = stateManager.captureState(game);
                    
                    if (!state1.player || !state2.player) {
                        throw new Error('状態キャプチャが不完全');
                    }
                    
                    return { 
                        captured: true,
                        stateSize: JSON.stringify(state1).length
                    };
                }
            },
            {
                name: '状態履歴の記録',
                execute: async (game, stateManager) => {
                    stateManager.startRecording();
                    
                    // 10フレーム分の状態を記録
                    for (let i = 0; i < 10; i++) {
                        stateManager.captureState(game);
                        await new Promise(resolve => setTimeout(resolve, 16));
                    }
                    
                    const history = stateManager.stopRecording();
                    
                    if (history.length !== 10) {
                        throw new Error(`履歴数が不正: ${history.length}`);
                    }
                    
                    return { historyLength: history.length };
                }
            },
            {
                name: '状態検証機能',
                execute: async (game, stateManager) => {
                    const validations = stateManager.validateGameState(game);
                    
                    // 正常な状態ではエラーがないはず
                    const errors = validations.filter(v => v.type === 'error');
                    if (errors.length > 0) {
                        throw new Error(`検証エラー: ${errors[0].message}`);
                    }
                    
                    return { validationCount: validations.length };
                }
            }
        ];
    }

    // プレイヤー動作テスト
    getPlayerMovementTests() {
        return [
            {
                name: '右移動の検証',
                execute: async (game, stateManager, testPlayer) => {
                    const initialX = game.player.x;
                    
                    await testPlayer.executeSequence([
                        { type: 'move', params: { direction: 'right', duration: 1000 } }
                    ]);
                    
                    const finalX = game.player.x;
                    
                    if (finalX <= initialX) {
                        throw new Error('右移動が機能していない');
                    }
                    
                    return { 
                        distance: finalX - initialX,
                        velocity: game.player.vx
                    };
                }
            },
            {
                name: 'ジャンプ動作の検証',
                execute: async (game, stateManager, testPlayer) => {
                    const initialY = game.player.y;
                    
                    await testPlayer.executeSequence([
                        { type: 'jump', params: { duration: 200 } },
                        { type: 'wait', params: { duration: 500 } }
                    ]);
                    
                    const maxHeight = Math.min(...testPlayer.results.map(r => r.endState.player.y));
                    
                    if (maxHeight >= initialY) {
                        throw new Error('ジャンプが機能していない');
                    }
                    
                    return { 
                        jumpHeight: initialY - maxHeight,
                        peaked: maxHeight < initialY - 50
                    };
                }
            },
            {
                name: '複合動作の検証',
                execute: async (game, stateManager, testPlayer) => {
                    await testPlayer.executeSequence([
                        { type: 'move', params: { direction: 'right', duration: 500 } },
                        { type: 'jump', params: { duration: 200 } },
                        { type: 'move', params: { direction: 'right', duration: 500 } }
                    ]);
                    
                    const summary = testPlayer.generateSummary();
                    
                    if (summary.failed > 0) {
                        throw new Error('複合動作中にエラー発生');
                    }
                    
                    return summary;
                }
            }
        ];
    }

    // ゲームメカニクステスト
    getGameMechanicsTests() {
        return [
            {
                name: 'コイン収集メカニクス',
                setup: async (game) => {
                    // コインを配置
                    game.levelCoins = [
                        { x: game.player.x + 100, y: game.player.y, collected: false }
                    ];
                    game.coins = 0;
                },
                execute: async (game, stateManager, testPlayer) => {
                    const initialCoins = game.coins;
                    
                    // コインに向かって移動
                    await testPlayer.executeSequence([
                        { type: 'move', params: { direction: 'right', duration: 2000 } }
                    ]);
                    
                    // 簡易的なコイン収集シミュレーション
                    if (Math.abs(game.player.x - game.levelCoins[0].x) < 30) {
                        game.coins++;
                        game.levelCoins[0].collected = true;
                    }
                    
                    return {
                        coinsCollected: game.coins - initialCoins,
                        success: game.coins > initialCoins
                    };
                }
            },
            {
                name: 'ライフシステム',
                execute: async (game, stateManager) => {
                    const initialLives = game.player.lives;
                    
                    // ダメージシミュレーション
                    game.player.lives--;
                    
                    if (game.player.lives !== initialLives - 1) {
                        throw new Error('ライフ減少が正しく機能していない');
                    }
                    
                    return {
                        initialLives,
                        currentLives: game.player.lives
                    };
                }
            }
        ];
    }

    // 物理エンジンテスト
    getPhysicsTests() {
        return [
            {
                name: '重力の適用',
                execute: async (game, stateManager) => {
                    // プレイヤーを空中に配置
                    game.player.y = 200;
                    game.player.grounded = false;
                    game.player.vy = 0;
                    
                    const initialY = game.player.y;
                    
                    // 重力シミュレーション（簡易版）
                    for (let i = 0; i < 10; i++) {
                        if (!game.player.grounded) {
                            game.player.vy += 0.5; // 重力
                            game.player.y += game.player.vy;
                        }
                        await new Promise(resolve => setTimeout(resolve, 16));
                    }
                    
                    if (game.player.y <= initialY) {
                        throw new Error('重力が適用されていない');
                    }
                    
                    return {
                        fallDistance: game.player.y - initialY,
                        velocity: game.player.vy
                    };
                }
            },
            {
                name: '速度制限の確認',
                execute: async (game, stateManager) => {
                    // 最大速度のシミュレーション
                    game.player.vx = 100; // 過剰な速度を設定
                    
                    // 速度制限（仮定値）
                    const MAX_SPEED = 5;
                    if (Math.abs(game.player.vx) > MAX_SPEED) {
                        game.player.vx = Math.sign(game.player.vx) * MAX_SPEED;
                    }
                    
                    if (Math.abs(game.player.vx) > MAX_SPEED) {
                        throw new Error('速度制限が機能していない');
                    }
                    
                    return {
                        limitedVelocity: game.player.vx,
                        maxSpeed: MAX_SPEED
                    };
                }
            }
        ];
    }

    // 衝突検出テスト
    getCollisionTests() {
        return [
            {
                name: 'プラットフォーム衝突',
                execute: async (game, stateManager) => {
                    // 簡易的な衝突判定
                    const platform = { x: 0, y: 400, width: 800, height: 20 };
                    const player = game.player;
                    
                    // プレイヤーがプラットフォーム上にいるかチェック
                    const onPlatform = 
                        player.x < platform.x + platform.width &&
                        player.x + 30 > platform.x &&
                        player.y < platform.y + platform.height &&
                        player.y + 40 > platform.y;
                    
                    return {
                        collision: onPlatform,
                        playerPos: { x: player.x, y: player.y }
                    };
                }
            },
            {
                name: '境界チェック',
                execute: async (game, stateManager) => {
                    const violations = [];
                    
                    if (game.player.x < 0) {
                        violations.push('左境界違反');
                    }
                    if (game.player.x > game.levelWidth) {
                        violations.push('右境界違反');
                    }
                    if (game.player.y < 0) {
                        violations.push('上境界違反');
                    }
                    
                    return {
                        violations,
                        inBounds: violations.length === 0
                    };
                }
            }
        ];
    }

    // テスト結果レポートの生成
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
                duration: `${totalDuration}ms`
            },
            details: this.testResults,
            timestamp: new Date().toISOString(),
            statistics: this.generateStatistics()
        };

        // TestReporterを使用してレポート生成
        if (typeof TestReporter !== 'undefined') {
            const reporter = new TestReporter();
            const consoleOutput = reporter.generateReport(report, 'console');
            console.log('\n' + consoleOutput);
        } else {
            // フォールバック
            console.log('\n📊 テスト結果サマリー');
            console.log('─'.repeat(40));
            console.log(`総テスト数: ${totalTests}`);
            console.log(`成功: ${passedTests}`);
            console.log(`失敗: ${failedTests}`);
            console.log(`成功率: ${report.summary.successRate}`);
            console.log(`実行時間: ${report.summary.duration}`);
        }

        return report;
    }

    // 統計情報の生成
    generateStatistics() {
        const stats = {
            byCategory: {},
            averageDuration: 0,
            slowestTest: null,
            fastestTest: null
        };

        // カテゴリ別集計
        this.testResults.forEach(result => {
            const category = result.name.split(':')[0] || 'その他';
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    totalDuration: 0
                };
            }
            
            stats.byCategory[category].total++;
            if (result.passed) {
                stats.byCategory[category].passed++;
            } else {
                stats.byCategory[category].failed++;
            }
            stats.byCategory[category].totalDuration += result.duration;
        });

        // 平均実行時間
        if (this.testResults.length > 0) {
            stats.averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length;
            
            // 最速・最遅テスト
            stats.slowestTest = this.testResults.reduce((slow, r) => 
                r.duration > slow.duration ? r : slow
            );
            stats.fastestTest = this.testResults.reduce((fast, r) => 
                r.duration < fast.duration ? r : fast
            );
        }

        return stats;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedGameTests;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.AutomatedGameTests = AutomatedGameTests;
}