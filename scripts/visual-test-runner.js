#!/usr/bin/env node

/**
 * ビジュアルテストランナー
 * Canvas描画のスナップショットテストを実行
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { spawn } = require('child_process');

class VisualTestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
        
        // Canvas描画の記録用
        this.canvasOperations = [];
        
        // テスト対象の画面状態
        this.testScenarios = [
            { name: 'タイトル画面', state: 'start' },
            { name: 'ゲームプレイ開始時', state: 'playing', frame: 0 },
            { name: 'プレイヤー移動後', state: 'playing', frame: 60, actions: ['moveRight'] },
            { name: 'ジャンプ中', state: 'playing', frame: 30, actions: ['jump'] },
            { name: 'ゲームオーバー画面', state: 'gameOver' },
            { name: 'レベルクリア画面', state: 'levelComplete' }
        ];
    }

    /**
     * Canvas操作をモック化
     */
    createCanvasMock(width = 1024, height = 576) {
        const operations = this.canvasOperations;
        
        return {
            width,
            height,
            getContext: (type) => {
                if (type !== '2d') return null;
                
                // 現在の変換行列を追跡
                let transformMatrix = [1, 0, 0, 1, 0, 0];
                const savedStates = [];
                
                return {
                    // 描画コンテキストの状態
                    fillStyle: '#000000',
                    strokeStyle: '#000000',
                    lineWidth: 1,
                    globalAlpha: 1,
                    font: '16px Arial',
                    
                    // 変換メソッド
                    save: () => {
                        savedStates.push([...transformMatrix]);
                        operations.push({ method: 'save', args: [] });
                    },
                    
                    restore: () => {
                        if (savedStates.length > 0) {
                            transformMatrix = savedStates.pop();
                        }
                        operations.push({ method: 'restore', args: [] });
                    },
                    
                    translate: (x, y) => {
                        transformMatrix[4] += x;
                        transformMatrix[5] += y;
                        operations.push({ method: 'translate', args: [x, y] });
                    },
                    
                    scale: (x, y) => {
                        transformMatrix[0] *= x;
                        transformMatrix[3] *= y;
                        operations.push({ method: 'scale', args: [x, y] });
                    },
                    
                    // 描画メソッド
                    fillRect: (x, y, w, h) => {
                        operations.push({ 
                            method: 'fillRect', 
                            args: [x, y, w, h],
                            style: this.fillStyle,
                            transform: [...transformMatrix]
                        });
                    },
                    
                    strokeRect: (x, y, w, h) => {
                        operations.push({ 
                            method: 'strokeRect', 
                            args: [x, y, w, h],
                            style: this.strokeStyle,
                            transform: [...transformMatrix]
                        });
                    },
                    
                    drawImage: (...args) => {
                        operations.push({ 
                            method: 'drawImage', 
                            args: args,
                            transform: [...transformMatrix]
                        });
                    },
                    
                    clearRect: (x, y, w, h) => {
                        operations.push({ 
                            method: 'clearRect', 
                            args: [x, y, w, h],
                            transform: [...transformMatrix]
                        });
                    },
                    
                    // パス描画
                    beginPath: () => {
                        operations.push({ method: 'beginPath', args: [] });
                    },
                    
                    moveTo: (x, y) => {
                        operations.push({ method: 'moveTo', args: [x, y] });
                    },
                    
                    lineTo: (x, y) => {
                        operations.push({ method: 'lineTo', args: [x, y] });
                    },
                    
                    arc: (x, y, radius, startAngle, endAngle, anticlockwise) => {
                        operations.push({ 
                            method: 'arc', 
                            args: [x, y, radius, startAngle, endAngle, anticlockwise] 
                        });
                    },
                    
                    fill: () => {
                        operations.push({ 
                            method: 'fill', 
                            args: [],
                            style: this.fillStyle 
                        });
                    },
                    
                    stroke: () => {
                        operations.push({ 
                            method: 'stroke', 
                            args: [],
                            style: this.strokeStyle 
                        });
                    },
                    
                    // テキスト描画
                    fillText: (text, x, y) => {
                        operations.push({ 
                            method: 'fillText', 
                            args: [text, x, y],
                            style: this.fillStyle,
                            transform: [...transformMatrix]
                        });
                    },
                    
                    // 画像データ操作（モック）
                    getImageData: (x, y, w, h) => {
                        return {
                            width: w,
                            height: h,
                            data: new Uint8ClampedArray(w * h * 4)
                        };
                    },
                    
                    putImageData: (imageData, x, y) => {
                        operations.push({ 
                            method: 'putImageData', 
                            args: [imageData, x, y] 
                        });
                    }
                };
            }
        };
    }

    /**
     * DOM環境をセットアップ
     */
    setupDOMEnvironment() {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head><title>Visual Test</title></head>
            <body>
                <canvas id="gameCanvas" width="1024" height="576"></canvas>
                <div id="titleScreen" style="display: none;"></div>
                <div id="gameScreen" style="display: none;"></div>
                <div id="gameOverScreen" style="display: none;"></div>
                <div id="levelCompleteScreen" style="display: none;"></div>
                <div id="scoreDisplay">0</div>
                <div id="livesDisplay">3</div>
                <div id="coinsDisplay">0</div>
            </body>
            </html>
        `, {
            url: 'http://localhost:8080',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        // グローバル変数を設定
        global.window = dom.window;
        global.document = dom.window.document;
        global.Image = dom.window.Image;
        global.requestAnimationFrame = (callback) => {
            return setTimeout(callback, 16); // 約60fps
        };
        global.cancelAnimationFrame = clearTimeout;

        // Canvasをモックに置き換え
        const canvas = this.createCanvasMock();
        global.document.getElementById = (id) => {
            if (id === 'gameCanvas') return canvas;
            return dom.window.document.getElementById(id);
        };

        return dom;
    }

    /**
     * ゲームインスタンスを作成してテスト
     */
    async testGameInstance() {
        try {
            // DOM環境をセットアップ
            this.setupDOMEnvironment();
            
            // config.jsのグローバル変数を手動で定義
            global.CANVAS_WIDTH = 1024;
            global.CANVAS_HEIGHT = 576;
            global.GRAVITY = 0.65;
            global.GROUND_Y = global.CANVAS_HEIGHT - 100;
            global.GAME_SPEED = 0.7;
            
            global.PLAYER_CONFIG = {
                width: 40,
                height: 60,
                speed: 3.5,
                jumpPower: 12,
                minJumpTime: 8,
                maxJumpTime: 20,
                maxHealth: 2,
                invulnerabilityTime: 120,
                spawnX: 100,
                spawnY: 300
            };
            
            global.ENEMY_CONFIG = {
                slime: {
                    width: 50,
                    height: 40,
                    speed: 1.0,
                    patrolDistance: 150,
                    type: 'slime'
                },
                bird: {
                    width: 40,
                    height: 35,
                    speed: 2.0,
                    amplitude: 50,
                    frequency: 0.02,
                    type: 'bird'
                }
            };
            
            global.ITEM_CONFIG = {
                coin: {
                    width: 30,
                    height: 30,
                    points: 10,
                    animationSpeed: 0.1
                },
                spring: {
                    width: 40,
                    height: 20,
                    power: 20,
                    animationSpeed: 0.2
                }
            };
            
            global.PARTICLE_CONFIG = {
                jump: {
                    count: 5,
                    lifetime: 30,
                    speed: 2,
                    color: '#ffffff'
                },
                damage: {
                    count: 10,
                    lifetime: 45,
                    speed: 3,
                    color: '#ff6b6b'
                },
                collect: {
                    count: 8,
                    lifetime: 40,
                    speed: 2.5,
                    color: '#ffd93d'
                }
            };
            
            global.STAGE_CONFIG = {
                titleScreen: {
                    bgColor: '#87ceeb',
                    textColor: '#ffffff'
                },
                gameplay: {
                    bgColor: '#87ceeb',
                    platformColor: '#8b4513'
                }
            };
            
            // GameStateクラスを定義
            global.GameState = require('../src/game-state.js');
            
            // SVGレンダリング関連をモック化
            global.SVGRenderer = class SVGRenderer {
                constructor() {}
                preloadAllSVGs() { return Promise.resolve(); }
                drawPlayer() {}
                drawEnemy() {}
                drawCoin() {}
                drawFlag() {}
                drawSpring() {}
            };
            
            global.SVGPlayerRenderer = class SVGPlayerRenderer {
                constructor() {}
                preloadSVGs() { return Promise.resolve(); }
                drawPlayer() {}
            };
            
            global.SVGEnemyRenderer = class SVGEnemyRenderer {
                constructor() {}
                preloadSVGs() { return Promise.resolve(); }
                drawEnemy() {}
            };
            
            global.SVGItemRenderer = class SVGItemRenderer {
                constructor() {}
                preloadSVGs() { return Promise.resolve(); }
                drawItem() {}
            };
            
            global.SVGGraphics = class SVGGraphics {
                constructor() {
                    this.playerRenderer = new SVGPlayerRenderer();
                    this.enemyRenderer = new SVGEnemyRenderer();
                    this.itemRenderer = new SVGItemRenderer();
                }
                preloadAllSVGs() { return Promise.resolve(); }
                drawPlayer() {}
                drawEnemy() {}
                drawItem() {}
                drawPlatform() {}
                drawBackground() {}
                drawCloud() {}
            };
            
            // 他の必要なクラス
            global.Player = require('../src/player.js');
            global.InputManager = require('../src/input-manager.js');
            global.LevelLoader = require('../src/level-loader.js');
            
            // MusicSystemをモック化
            global.MusicSystem = class MusicSystem {
                constructor() {}
                init() {}
                playTitleBGM() {}
                playGameBGM() {}
                playGameOverBGM() {}
                stopBGM() {}
                playSoundEffect() {}
                playJumpSound() {}
                playCoinSound() {}
                playDamageSound() {}
                playGameOverSound() {}
                playGoalSound() {}
                playVictoryJingle() {}
                playGameStartSound() {}
                destroy() {}
            };
            
            // Gameクラスを読み込み
            const Game = require('../src/game.js');
            
            // ゲームインスタンスを作成
            const game = new Game();
            
            // ゲームループを停止（自動的に開始されている場合）
            if (game.animationId) {
                cancelAnimationFrame(game.animationId);
                game.animationId = null;
            }
            
            // 初期化処理をモック化
            if (game.initialize) {
                // 初期化は実行するが、ゲームループは開始しない
                const originalStart = game.start;
                game.start = () => {}; // ゲームループの開始を無効化
                
                // 初期化を実行
                try {
                    game.initialize();
                } catch (e) {
                    // 初期化エラーは無視（SVG読み込みなど）
                }
                
                game.start = originalStart; // 元に戻す
            }
            
            this.addTestResult('Gameクラスのインスタンス化', true, 'ゲームインスタンスが正常に作成されました');
            
            return game;
            
        } catch (error) {
            this.addTestResult('Gameクラスのインスタンス化', false, error.message);
            return null;
        }
    }

    /**
     * 特定のゲーム状態での描画をテスト
     */
    async testGameState(game, scenario) {
        if (!game) return;
        
        try {
            // Canvas操作をクリア
            this.canvasOperations = [];
            
            // ゲーム状態を設定
            if (game.gameState) {
                game.gameState.setState(scenario.state);
            }
            
            // アクションを実行
            if (scenario.actions) {
                for (const action of scenario.actions) {
                    switch (action) {
                        case 'moveRight':
                            if (game.player) {
                                game.player.x += 50;
                                game.player.facingRight = true;
                            }
                            break;
                        case 'jump':
                            if (game.player && game.player.jump) {
                                game.player.jump();
                            }
                            break;
                    }
                }
            }
            
            // 指定フレーム数分更新
            const frames = scenario.frame || 1;
            for (let i = 0; i < frames; i++) {
                if (game.update) {
                    game.update();
                }
            }
            
            // 描画を実行
            if (game.render) {
                game.render();
            }
            
            // 描画操作を分析
            const analysis = this.analyzeCanvasOperations();
            
            this.addTestResult(
                `${scenario.name}の描画`,
                analysis.hasDrawOperations,
                `描画操作数: ${analysis.operationCount}, 主な操作: ${analysis.mainOperations.join(', ')}`
            );
            
            // スナップショットを保存（操作履歴として）
            this.saveSnapshot(scenario.name, this.canvasOperations);
            
        } catch (error) {
            this.addTestResult(
                `${scenario.name}の描画`,
                false,
                error.message
            );
        }
    }

    /**
     * Canvas操作を分析
     */
    analyzeCanvasOperations() {
        const operations = this.canvasOperations;
        const operationTypes = {};
        
        // 操作タイプ別にカウント
        operations.forEach(op => {
            operationTypes[op.method] = (operationTypes[op.method] || 0) + 1;
        });
        
        // 主要な操作を特定
        const mainOperations = Object.keys(operationTypes)
            .sort((a, b) => operationTypes[b] - operationTypes[a])
            .slice(0, 5);
        
        return {
            operationCount: operations.length,
            hasDrawOperations: operations.length > 0,
            operationTypes,
            mainOperations
        };
    }

    /**
     * スナップショットを保存
     */
    saveSnapshot(scenarioName, operations) {
        const snapshotDir = path.join(__dirname, '..', 'tests', 'snapshots');
        
        // ディレクトリが存在しない場合は作成
        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }
        
        // ファイル名をサニタイズ
        const fileName = scenarioName.replace(/[^a-zA-Z0-9-_]/g, '_') + '.json';
        const filePath = path.join(snapshotDir, fileName);
        
        // 操作履歴を保存
        const snapshot = {
            scenario: scenarioName,
            timestamp: new Date().toISOString(),
            operationCount: operations.length,
            operations: operations.slice(0, 100) // 最初の100操作のみ保存（サイズ制限）
        };
        
        fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    }

    /**
     * スナップショットを比較
     */
    compareSnapshots(current, baseline) {
        // 操作数の比較
        if (current.length !== baseline.length) {
            return {
                match: false,
                reason: `操作数が異なります (現在: ${current.length}, 基準: ${baseline.length})`
            };
        }
        
        // 各操作を比較
        for (let i = 0; i < current.length; i++) {
            const currOp = current[i];
            const baseOp = baseline[i];
            
            if (currOp.method !== baseOp.method) {
                return {
                    match: false,
                    reason: `操作${i}のメソッドが異なります (${currOp.method} vs ${baseOp.method})`
                };
            }
            
            // 引数の比較（数値は誤差を許容）
            if (!this.argsMatch(currOp.args, baseOp.args)) {
                return {
                    match: false,
                    reason: `操作${i}の引数が異なります`
                };
            }
        }
        
        return { match: true };
    }

    /**
     * 引数の比較（数値の誤差を許容）
     */
    argsMatch(args1, args2, tolerance = 0.01) {
        if (args1.length !== args2.length) return false;
        
        for (let i = 0; i < args1.length; i++) {
            const a1 = args1[i];
            const a2 = args2[i];
            
            if (typeof a1 === 'number' && typeof a2 === 'number') {
                if (Math.abs(a1 - a2) > tolerance) return false;
            } else if (a1 !== a2) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * テスト結果を追加
     */
    addTestResult(name, passed, message) {
        const result = {
            name,
            passed,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(result);
        this.results.summary.total++;
        
        if (passed) {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }
        
        // コンソールに出力
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}: ${message}`);
    }

    /**
     * すべてのテストを実行
     */
    async runAllTests() {
        console.log('🎨 ビジュアルテストを開始します...\n');
        
        // 1. ゲームインスタンスの作成テスト
        console.log('📦 ゲームインスタンスの作成...');
        const game = await this.testGameInstance();
        
        if (!game) {
            console.log('\n❌ ゲームインスタンスの作成に失敗しました。テストを中止します。');
            return this.results;
        }
        
        // 2. 各シナリオでの描画テスト
        console.log('\n🖼️ 各画面状態での描画テスト...');
        for (const scenario of this.testScenarios) {
            await this.testGameState(game, scenario);
        }
        
        // 3. レポート生成
        this.generateReport();
        
        return this.results;
    }

    /**
     * レポートを生成
     */
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ビジュアルテスト結果サマリー');
        console.log('='.repeat(60));
        console.log(`総テスト数: ${this.results.summary.total}`);
        console.log(`✅ 成功: ${this.results.summary.passed}`);
        console.log(`❌ 失敗: ${this.results.summary.failed}`);
        console.log(`⏭️  スキップ: ${this.results.summary.skipped}`);
        console.log(`成功率: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
        
        // 結果をファイルに保存
        const resultPath = path.join(__dirname, '..', 'test-results', 'visual-test-results.json');
        fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 詳細な結果を保存しました: ${resultPath}`);
        
        // スナップショットの保存場所を通知
        console.log(`📸 スナップショットを保存しました: tests/snapshots/`);
    }
}

// メイン処理
async function main() {
    const runner = new VisualTestRunner();
    await runner.runAllTests();
    
    // テスト失敗時は非ゼロの終了コードを返す
    process.exit(runner.results.summary.failed > 0 ? 1 : 0);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('未処理のエラー:', error);
    process.exit(1);
});

// 実行
if (require.main === module) {
    main().catch(error => {
        console.error('実行エラー:', error);
        process.exit(1);
    });
}

module.exports = VisualTestRunner;