/**
 * 自動テストプレイヤー
 * ゲームを自動的にプレイしてテストシナリオを実行
 */

class AutomatedTestPlayer {
    constructor(game, stateManager) {
        this.game = game;
        this.stateManager = stateManager;
        this.actions = [];
        this.currentActionIndex = 0;
        this.running = false;
        this.results = [];
    }

    // アクションの記録
    recordAction(type, params = {}) {
        this.actions.push({
            type,
            params,
            timestamp: Date.now()
        });
    }

    // プリセットされたアクションシーケンスを実行
    async executeSequence(sequence) {
        this.actions = sequence;
        this.currentActionIndex = 0;
        this.running = true;
        this.results = [];

        while (this.running && this.currentActionIndex < this.actions.length) {
            const action = this.actions[this.currentActionIndex];
            await this.executeAction(action);
            this.currentActionIndex++;
        }

        return this.results;
    }

    // 単一アクションの実行
    async executeAction(action) {
        const startState = this.stateManager.captureState(this.game);

        switch (action.type) {
            case 'move':
                await this.move(action.params.direction, action.params.duration || 1000);
                break;
            case 'jump':
                await this.jump(action.params.duration || 500);
                break;
            case 'wait':
                await this.wait(action.params.duration || 1000);
                break;
            case 'waitForCondition':
                await this.waitForCondition(action.params.condition, action.params.timeout);
                break;
            case 'assert':
                await this.assertCondition(action.params.condition, action.params.message);
                break;
        }

        const endState = this.stateManager.captureState(this.game);
        
        this.results.push({
            action: action,
            startState: startState,
            endState: endState,
            success: true
        });
    }

    // 移動アクション
    async move(direction, duration) {
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const moveInterval = setInterval(() => {
                if (Date.now() - startTime >= duration) {
                    this.game.keys[direction] = false;
                    clearInterval(moveInterval);
                    resolve();
                } else {
                    this.game.keys[direction] = true;
                }
            }, 16); // 60 FPS
        });
    }

    // ジャンプアクション
    async jump(duration) {
        this.game.keys.up = true;
        
        return new Promise(resolve => {
            setTimeout(() => {
                this.game.keys.up = false;
                resolve();
            }, duration);
        });
    }

    // 待機
    async wait(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    // 条件を満たすまで待機
    async waitForCondition(conditionFn, timeout = 5000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                const state = this.stateManager.captureState(this.game);
                if (conditionFn(state)) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Condition timeout'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // 条件アサーション
    async assertCondition(conditionFn, message) {
        const state = this.stateManager.captureState(this.game);
        if (!conditionFn(state)) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // 共通テストシナリオ
    static get scenarios() {
        return {
            // 基本移動テスト
            basicMovement: [
                { type: 'wait', params: { duration: 500 } },
                { type: 'move', params: { direction: 'right', duration: 1000 } },
                { type: 'assert', params: { 
                    condition: (state) => state.player.x > 50,
                    message: 'Player should move right'
                }},
                { type: 'move', params: { direction: 'left', duration: 1000 } },
                { type: 'assert', params: {
                    condition: (state) => state.player.x < 100,
                    message: 'Player should move left'
                }}
            ],

            // ジャンプテスト
            jumpTest: [
                { type: 'wait', params: { duration: 500 } },
                { type: 'jump', params: { duration: 100 } },
                { type: 'wait', params: { duration: 500 } },
                { type: 'assert', params: {
                    condition: (state) => state.player.y < 400,
                    message: 'Player should jump'
                }},
                { type: 'waitForCondition', params: {
                    condition: (state) => state.player.grounded,
                    timeout: 3000
                }}
            ],

            // コイン収集テスト
            coinCollection: [
                { type: 'wait', params: { duration: 500 } },
                { type: 'move', params: { direction: 'right', duration: 2000 } },
                { type: 'waitForCondition', params: {
                    condition: (state) => state.player.coins > 0,
                    timeout: 5000
                }},
                { type: 'assert', params: {
                    condition: (state) => state.player.coins >= 1,
                    message: 'Player should collect at least one coin'
                }}
            ],

            // プラットフォームジャンプ
            platformJump: [
                { type: 'wait', params: { duration: 500 } },
                { type: 'move', params: { direction: 'right', duration: 1000 } },
                { type: 'jump', params: { duration: 300 } },
                { type: 'move', params: { direction: 'right', duration: 500 } },
                { type: 'waitForCondition', params: {
                    condition: (state) => state.player.grounded && state.player.y < 350,
                    timeout: 3000
                }},
                { type: 'assert', params: {
                    condition: (state) => state.player.y < 350,
                    message: 'Player should be on platform'
                }}
            ],

            // 敵回避テスト
            enemyAvoidance: [
                { type: 'wait', params: { duration: 500 } },
                { type: 'move', params: { direction: 'right', duration: 1500 } },
                { type: 'jump', params: { duration: 200 } },
                { type: 'wait', params: { duration: 1000 } },
                { type: 'assert', params: {
                    condition: (state) => state.player.lives === 3,
                    message: 'Player should not lose lives'
                }}
            ]
        };
    }

    // テスト結果のサマリー
    generateSummary() {
        const summary = {
            totalActions: this.results.length,
            successful: this.results.filter(r => r.success).length,
            failed: this.results.filter(r => !r.success).length,
            playerPath: this.results.map(r => ({
                x: r.endState.player.x,
                y: r.endState.player.y
            })),
            finalState: this.results.length > 0 ? 
                this.results[this.results.length - 1].endState : null
        };

        return summary;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTestPlayer;
}