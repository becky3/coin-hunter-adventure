/**
 * ゲーム状態管理システム
 * テスト可能な状態スナップショットと検証機能を提供
 */

class GameStateManager {
    constructor() {
        this.stateHistory = [];
        this.maxHistory = 1000;
        this.recording = false;
        this.listeners = new Map();
    }

    // ゲーム状態のスナップショットを作成
    captureState(game) {
        if (!game) return null;

        const state = {
            timestamp: Date.now(),
            frame: game.frameCount || 0,
            player: {
                x: game.player.x,
                y: game.player.y,
                vx: game.player.vx,
                vy: game.player.vy,
                grounded: game.player.grounded,
                lives: game.player.lives,
                coins: game.coins,
                animation: game.player.animation || 'idle',
                facingRight: game.player.facingRight
            },
            enemies: game.enemies.map(e => ({
                type: e.type,
                x: e.x,
                y: e.y,
                vx: e.vx,
                vy: e.vy,
                active: e.active !== false
            })),
            items: {
                coins: game.levelCoins.filter(c => !c.collected).map(c => ({
                    x: c.x,
                    y: c.y
                })),
                springs: game.springs ? game.springs.map(s => ({
                    x: s.x,
                    y: s.y,
                    active: s.active !== false
                })) : []
            },
            camera: {
                x: game.cameraX || 0,
                y: game.cameraY || 0
            },
            gameState: game.state || 'playing',
            level: game.currentLevel || 1
        };

        if (this.recording) {
            this.stateHistory.push(state);
            if (this.stateHistory.length > this.maxHistory) {
                this.stateHistory.shift();
            }
        }

        return state;
    }

    // 記録開始/停止
    startRecording() {
        this.recording = true;
        this.stateHistory = [];
    }

    stopRecording() {
        this.recording = false;
        return this.stateHistory;
    }

    // 状態の比較
    compareStates(state1, state2, tolerance = 0.01) {
        const diff = {
            player: {},
            enemies: [],
            items: {},
            overall: true
        };

        // プレイヤー位置の比較
        if (Math.abs(state1.player.x - state2.player.x) > tolerance) {
            diff.player.x = { expected: state1.player.x, actual: state2.player.x };
            diff.overall = false;
        }
        if (Math.abs(state1.player.y - state2.player.y) > tolerance) {
            diff.player.y = { expected: state1.player.y, actual: state2.player.y };
            diff.overall = false;
        }

        // その他の重要な状態の比較
        if (state1.player.coins !== state2.player.coins) {
            diff.player.coins = { expected: state1.player.coins, actual: state2.player.coins };
            diff.overall = false;
        }
        if (state1.player.lives !== state2.player.lives) {
            diff.player.lives = { expected: state1.player.lives, actual: state2.player.lives };
            diff.overall = false;
        }

        return diff;
    }

    // 特定の条件を満たすまで待機
    async waitForCondition(game, conditionFn, timeout = 5000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                const state = this.captureState(game);
                if (conditionFn(state)) {
                    resolve(state);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Condition timeout'));
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }

    // ゲームイベントの記録
    recordEvent(eventType, data) {
        const event = {
            timestamp: Date.now(),
            type: eventType,
            data: data
        };

        // リスナーに通知
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(fn => fn(event));
        }

        return event;
    }

    // イベントリスナー登録
    addEventListener(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    // 状態検証用のアサーション
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // ゲーム状態の検証
    validateGameState(game) {
        const validations = [];

        // プレイヤーの位置が有効範囲内か
        if (game.player.x < 0 || game.player.x > game.levelWidth) {
            validations.push({
                type: 'error',
                message: `Player X position out of bounds: ${game.player.x}`
            });
        }

        // プレイヤーのライフが有効範囲内か
        if (game.player.lives < 0 || game.player.lives > 5) {
            validations.push({
                type: 'warning',
                message: `Player lives unusual: ${game.player.lives}`
            });
        }

        // コイン数が負でないか
        if (game.coins < 0) {
            validations.push({
                type: 'error',
                message: `Negative coin count: ${game.coins}`
            });
        }

        return validations;
    }

    // 状態履歴の分析
    analyzeHistory() {
        if (this.stateHistory.length === 0) return null;

        const analysis = {
            totalFrames: this.stateHistory.length,
            duration: this.stateHistory[this.stateHistory.length - 1].timestamp - this.stateHistory[0].timestamp,
            playerPath: this.stateHistory.map(s => ({ x: s.player.x, y: s.player.y })),
            coinCollections: [],
            deaths: [],
            averageVelocity: { x: 0, y: 0 }
        };

        // コイン収集とデスを検出
        for (let i = 1; i < this.stateHistory.length; i++) {
            const prev = this.stateHistory[i - 1];
            const curr = this.stateHistory[i];

            if (curr.player.coins > prev.player.coins) {
                analysis.coinCollections.push({
                    frame: i,
                    position: { x: curr.player.x, y: curr.player.y }
                });
            }

            if (curr.player.lives < prev.player.lives) {
                analysis.deaths.push({
                    frame: i,
                    position: { x: curr.player.x, y: curr.player.y }
                });
            }
        }

        return analysis;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}